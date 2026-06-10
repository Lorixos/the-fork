import os
import json
import sys
import http.server
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timedelta
from google.cloud import bigquery

# Helper functions for performance data processing
def normalize_market(m):
    if not m:
        return "ES"
    m_upper = m.upper()
    if '6982545611807555586' in m_upper or 'FR' in m_upper or 'LAFOURCHETTE' in m_upper:
        return 'FR'
    if '6982545462632906753' in m_upper or 'ES' in m_upper:
        return 'ES'
    if '7015602279810138113' in m_upper or 'GB' in m_upper or 'UNITED KINGDOM' in m_upper or 'CO.UK' in m_upper:
        return 'GB'
    if '7190030035821166594' in m_upper or 'BE' in m_upper:
        return 'BE'
    if '7071236272924262402' in m_upper or 'AU' in m_upper:
        return 'AU'
    if 'AT' in m_upper:
        return 'AT'
    if 'DE' in m_upper:
        return 'DE'
    if 'SE' in m_upper:
        return 'SE'
    if 'NL' in m_upper:
        return 'NL'
    if 'IT' in m_upper:
        return 'IT'
    if 'PT' in m_upper:
        return 'PT'
    if 'CH' in m_upper:
        return 'CH'
    return m_upper[:2]

def normalize_objective(campaign_3):
    if not campaign_3:
        return "Booking"
    c3 = campaign_3.upper()
    if "INSTALL" in c3:
        return "Install"
    return "Booking"

def normalize_target(campaign_1):
    if not campaign_1:
        return "NC"
    c1 = campaign_1.upper()
    if "RP" in c1:
        return "RP"
    if "NC" in c1:
        return "NC"
    return "ALL"

def normalize_campaign(campaign_3):
    if not campaign_3:
        return "Booking"
    c3 = campaign_3.upper()
    if "INSTALL" in c3:
        return "Install"
    return "Booking"

def coerce_day(day):
    if isinstance(day, str):
        return datetime.strptime(day, "%Y-%m-%d").date()
    if hasattr(day, "strftime"):
        return day
    return day

# Set Google Application Credentials
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/lorik/.gemini/antigravity/profile_configs/Dept/service-account.json"
PROJECT_ID = "byte-data-management"
DATASET_ID = "dashboard_backend"
TABLE_NAME = f"{PROJECT_ID}.{DATASET_ID}.the_fork_commentaries"
BUDGETS_TABLE_NAME = f"{PROJECT_ID}.{DATASET_ID}.the_fork_campaign_budgets"

class DashboardServerHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Print logs to stderr for easy monitoring
        sys.stderr.write("%s - - [%s] %s\n" %
                         (self.address_string(),
                          self.log_date_time_string(),
                          format%args))

    def send_json_response(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        # Handle preflight CORS requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed_url = urlparse(self.path)
        if parsed_url.path == '/api/commentary':
            self.handle_get_commentary(parsed_url.query)
        elif parsed_url.path == '/api/commentary/saved_weeks':
            self.handle_get_saved_weeks(parsed_url.query)
        elif parsed_url.path == '/api/budgets':
            self.handle_get_budgets(parsed_url.query)
        elif parsed_url.path == '/api/performance':
            self.handle_get_performance(parsed_url.query)
        else:
            # Serve static files using parent class
            super().do_GET()

    def do_POST(self):
        parsed_url = urlparse(self.path)
        if parsed_url.path == '/api/commentary':
            self.handle_post_commentary()
        elif parsed_url.path == '/api/budgets':
            self.handle_post_budgets()
        else:
            self.send_json_response(404, {"error": "Not Found"})

    def handle_get_commentary(self, query_string):
        params = parse_qs(query_string)
        
        # Extract filters
        market = params.get('market', [''])[0]
        date_start = params.get('date_start', [''])[0]
        date_end = params.get('date_end', [''])[0]
        objective = params.get('objective', [''])[0]
        target = params.get('target', [''])[0]
        campaign = params.get('campaign', [''])[0]
        platform = params.get('platform', ['meta'])[0]

        if not all([market, date_start, date_end, objective, target, campaign]):
            self.send_json_response(400, {"error": "Missing required filters"})
            return

        try:
            client = bigquery.Client(project=PROJECT_ID)
            
            # Query the latest commentary matching the exact filter context
            sql_query = f"""
            SELECT 
              created_at, market, date_start, date_end, objective, target, campaign, 
              commentary, status, chips, author, TO_JSON_STRING(metrics) as metrics_json, platform
            FROM `{TABLE_NAME}`
            WHERE market = @market
              AND date_start = @date_start
              AND date_end = @date_end
              AND objective = @objective
              AND target = @target
              AND campaign = @campaign
              AND (platform = @platform OR (platform IS NULL AND @platform = 'meta'))
            ORDER BY created_at DESC
            LIMIT 1
            """
            
            job_config = bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ScalarQueryParameter("market", "STRING", market),
                    bigquery.ScalarQueryParameter("date_start", "DATE", date_start),
                    bigquery.ScalarQueryParameter("date_end", "DATE", date_end),
                    bigquery.ScalarQueryParameter("objective", "STRING", objective),
                    bigquery.ScalarQueryParameter("target", "STRING", target),
                    bigquery.ScalarQueryParameter("campaign", "STRING", campaign),
                    bigquery.ScalarQueryParameter("platform", "STRING", platform),
                ]
            )
            
            query_job = client.query(sql_query, job_config=job_config)
            results = list(query_job.result())
            
            if results:
                row = results[0]
                commentary_data = {
                    "created_at": str(row.created_at),
                    "market": row.market,
                    "date_start": str(row.date_start),
                    "date_end": str(row.date_end),
                    "objective": row.objective,
                    "target": row.target,
                    "campaign": row.campaign,
                    "commentary": row.commentary,
                    "status": row.status,
                    "chips": list(row.chips) if row.chips else [],
                    "author": row.author,
                    "platform": row.platform if hasattr(row, 'platform') and row.platform else 'meta',
                    "metrics": json.loads(row.metrics_json) if row.metrics_json else {}
                }
                self.send_json_response(200, commentary_data)
            else:
                # No commentary found for this context
                self.send_json_response(200, {})
                
        except Exception as e:
            sys.stderr.write(f"Error querying BigQuery: {str(e)}\n")
            self.send_json_response(500, {"error": f"Database error: {str(e)}"})

    def handle_get_saved_weeks(self, query_string):
        params = parse_qs(query_string)
        platform = params.get('platform', ['meta'])[0]
        
        try:
            client = bigquery.Client(project=PROJECT_ID)
            sql_query = f"""
            SELECT DISTINCT date_start, date_end 
            FROM `{TABLE_NAME}`
            WHERE platform = @platform OR (platform IS NULL AND @platform = 'meta')
            ORDER BY date_start DESC
            """
            job_config = bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ScalarQueryParameter("platform", "STRING", platform),
                ]
            )
            query_job = client.query(sql_query, job_config=job_config)
            results = list(query_job.result())
            
            weeks = []
            for row in results:
                weeks.append({
                    "date_start": str(row.date_start),
                    "date_end": str(row.date_end)
                })
            self.send_json_response(200, weeks)
        except Exception as e:
            sys.stderr.write(f"Error querying BigQuery: {str(e)}\n")
            self.send_json_response(500, {"error": f"Database error: {str(e)}"})

    def handle_post_commentary(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_json_response(400, {"error": "Empty body"})
                return

            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))

            # Extract fields
            market = data.get('market')
            date_start = data.get('date_start')
            date_end = data.get('date_end')
            objective = data.get('objective')
            target = data.get('target')
            campaign = data.get('campaign')
            commentary = data.get('commentary', '')
            status = data.get('status', 'Draft')
            chips = data.get('chips', [])
            author = data.get('author', 'Dept team')
            metrics = data.get('metrics', {})
            platform = data.get('platform', 'meta')

            if not all([market, date_start, date_end, objective, target, campaign]):
                self.send_json_response(400, {"error": "Missing required fields in payload"})
                return

            client = bigquery.Client(project=PROJECT_ID)

            # Insert commentary snapshot into BigQuery
            insert_query = f"""
            INSERT INTO `{TABLE_NAME}` 
            (market, date_start, date_end, objective, target, campaign, commentary, status, chips, author, metrics, platform)
            VALUES
            (@market, @date_start, @date_end, @objective, @target, @campaign, @commentary, @status, @chips, @author, SAFE.PARSE_JSON(@metrics_json), @platform)
            """

            job_config = bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ScalarQueryParameter("market", "STRING", market),
                    bigquery.ScalarQueryParameter("date_start", "DATE", date_start),
                    bigquery.ScalarQueryParameter("date_end", "DATE", date_end),
                    bigquery.ScalarQueryParameter("objective", "STRING", objective),
                    bigquery.ScalarQueryParameter("target", "STRING", target),
                    bigquery.ScalarQueryParameter("campaign", "STRING", campaign),
                    bigquery.ScalarQueryParameter("commentary", "STRING", commentary),
                    bigquery.ScalarQueryParameter("status", "STRING", status),
                    bigquery.ArrayQueryParameter("chips", "STRING", chips),
                    bigquery.ScalarQueryParameter("author", "STRING", author),
                    bigquery.ScalarQueryParameter("metrics_json", "STRING", json.dumps(metrics)),
                    bigquery.ScalarQueryParameter("platform", "STRING", platform),
                ]
            )

            query_job = client.query(insert_query, job_config=job_config)
            query_job.result() # Wait for insert to complete

            self.send_json_response(200, {"status": "success", "message": "Commentary snapshot saved to BigQuery."})

        except Exception as e:
            sys.stderr.write(f"Error inserting into BigQuery: {str(e)}\n")
            self.send_json_response(500, {"error": f"Database error: {str(e)}"})

    def handle_get_budgets(self, query_string):
        params = parse_qs(query_string)
        platform = params.get('platform', ['meta'])[0]

        try:
            client = bigquery.Client(project=PROJECT_ID)
            sql_query = f"""
            SELECT campaign_name, budget
            FROM `{BUDGETS_TABLE_NAME}`
            WHERE platform = @platform
            """
            job_config = bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ScalarQueryParameter("platform", "STRING", platform),
                ]
            )
            query_job = client.query(sql_query, job_config=job_config)
            results = list(query_job.result())
            
            budgets = {row.campaign_name: row.budget for row in results}
            self.send_json_response(200, budgets)
        except Exception as e:
            sys.stderr.write(f"Error querying budgets from BigQuery: {str(e)}\n")
            self.send_json_response(500, {"error": f"Database error: {str(e)}"})

    def handle_post_budgets(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            payload = json.loads(post_data.decode('utf-8'))
            
            platform = payload.get('platform', 'meta')
            budgets = payload.get('budgets', {})
            updated_by = payload.get('updated_by', 'user')
            
            if not budgets:
                self.send_json_response(200, {"status": "success", "message": "No budgets to update"})
                return
                
            client = bigquery.Client(project=PROJECT_ID)
            updates = [{"campaign_name": name, "budget": float(val)} for name, val in budgets.items()]
            
            sql_query = f"""
            MERGE `{BUDGETS_TABLE_NAME}` T
            USING UNNEST(@updates) S
            ON T.campaign_name = S.campaign_name AND T.platform = @platform
            WHEN MATCHED THEN
              UPDATE SET budget = S.budget, updated_at = CURRENT_TIMESTAMP(), updated_by = @updated_by
            WHEN NOT MATCHED THEN
              INSERT (campaign_name, platform, budget, updated_at, updated_by)
              VALUES (S.campaign_name, @platform, S.budget, CURRENT_TIMESTAMP(), @updated_by)
            """
            
            job_config = bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ArrayQueryParameter(
                        "updates", 
                        "RECORD", 
                        [
                            bigquery.StructQueryParameter(
                                "",
                                bigquery.ScalarQueryParameter("campaign_name", "STRING", u["campaign_name"]),
                                bigquery.ScalarQueryParameter("budget", "FLOAT", u["budget"])
                            )
                            for u in updates
                        ]
                    ),
                    bigquery.ScalarQueryParameter("platform", "STRING", platform),
                    bigquery.ScalarQueryParameter("updated_by", "STRING", updated_by),
                ]
            )
            
            query_job = client.query(sql_query, job_config=job_config)
            query_job.result()
            
            self.send_json_response(200, {"status": "success", "message": f"Updated {len(updates)} campaign budgets"})
            
        except Exception as e:
            sys.stderr.write(f"Error merging budgets in BigQuery: {str(e)}\n")
            self.send_json_response(500, {"error": f"Database error: {str(e)}"})

    def handle_get_performance(self, query_string):
        params = parse_qs(query_string)
        platform = params.get('platform', ['meta'])[0]
        
        is_tiktok = (platform == 'tiktok')
        table_name = "thefork_tiktok_ads_modeled" if is_tiktok else "the_fork_fb_ads_modeled"
        
        video_views_p100_select = "0 AS video_views_p100" if is_tiktok else "video_views_p100"
        cta_select = "cta_app_install, cta_purchase" if is_tiktok else "0 AS cta_app_install, 0 AS cta_purchase"
        
        query = f"""
        SELECT 
          day,
          Market,
          Campaign_1,
          Campaign_2,
          Campaign_5,
          Campaign_3,
          campaign_name,
          ad_name,
          creative_image_url,
          creative_thumbnail_url,
          creative_link,
          video_views,
          {video_views_p100_select},
          {cta_select},
          costs,
          impressions,
          outbound_clicks,
          landing_page_views,
          installs,
          purchases
        FROM `byte-data-management.Data_Cleanup.{table_name}`
        WHERE day >= '2026-01-01'
        ORDER BY day ASC
        """
        
        try:
            client = bigquery.Client(project="byte-data-management")
            query_job = client.query(query)
            rows = list(query_job.result())
            
            max_day = max(coerce_day(row.day) for row in rows) if rows else None
            
            # Group daily records
            groups = {}
            for row in rows:
                day_date = coerce_day(row.day)
                week_start = day_date - timedelta(days=day_date.weekday())
                week_start_str = str(week_start)
                
                m = normalize_market(row.Market)
                obj = normalize_objective(row.Campaign_3)
                tgt = normalize_target(row.Campaign_1)
                cmp = normalize_campaign(row.Campaign_3)
                campaign_name = row.campaign_name or ""
                ad_name = row.ad_name or ""
                
                group_key = (week_start_str, m, obj, tgt, cmp, campaign_name, ad_name)
                if group_key not in groups:
                    groups[group_key] = []
                groups[group_key].append(row)
                
            weekly_data = {}
            for key, daily_rows in groups.items():
                week_start_str, m, obj, tgt, cmp, campaign_name, ad_name = key
                w_start = datetime.strptime(week_start_str, "%Y-%m-%d").date()
                w_end = w_start + timedelta(days=6)
                
                spend = sum(r.costs or 0.0 for r in daily_rows)
                impressions = sum(r.impressions or 0 for r in daily_rows)
                clicks = sum(r.outbound_clicks or 0 for r in daily_rows)
                lpv = sum(r.landing_page_views or 0 for r in daily_rows)
                installs = sum(r.installs or 0 for r in daily_rows)
                bookings = sum(r.purchases or 0 for r in daily_rows)
                video_views = sum(r.video_views or 0 for r in daily_rows)
                video_completions = sum(r.video_views_p100 or 0 for r in daily_rows)
                cta_installs = sum(r.cta_app_install or 0 for r in daily_rows)
                cta_bookings = sum(r.cta_purchase or 0 for r in daily_rows)
                
                date_end_val = w_end
                if max_day and w_end > max_day:
                    date_end_val = max_day

                weekly_data[key] = {
                    "date_start": week_start_str,
                    "date_end": str(date_end_val),
                    "days_present": (date_end_val - w_start).days + 1,
                    "market": m,
                    "objective": obj,
                    "target": tgt,
                    "campaign": cmp,
                    "campaign_name": campaign_name,
                    "creative": ad_name,
                    "creative_image_url": daily_rows[0].creative_image_url or "",
                    "creative_thumbnail_url": daily_rows[0].creative_thumbnail_url or "",
                    "creative_link": daily_rows[0].creative_link or "",
                    "spend": spend,
                    "impressions": impressions,
                    "link_clicks": clicks,
                    "landing_page_views": lpv,
                    "installs": installs,
                    "bookings": bookings,
                    "video_views": video_views,
                    "video_completions": video_completions,
                    "cta_installs": cta_installs,
                    "cta_bookings": cta_bookings
                }
                
            final_rows = []
            for key, current in weekly_data.items():
                week_start_str, m, obj, tgt, cmp, campaign_name, ad_name = key
                
                w_start = datetime.strptime(week_start_str, "%Y-%m-%d").date()
                prev_week_start_str = str(w_start - timedelta(days=7))
                prev_key = (prev_week_start_str, m, obj, tgt, cmp, campaign_name, ad_name)
                
                days_present = current.get("days_present", 7)
                scale = days_present / 7.0
                
                if prev_key in weekly_data:
                    prev = weekly_data[prev_key]
                    current["prev_spend"] = prev["spend"] * scale
                    current["prev_impressions"] = int(prev["impressions"] * scale)
                    current["prev_link_clicks"] = int(prev["link_clicks"] * scale)
                    current["prev_landing_page_views"] = int(prev["landing_page_views"] * scale)
                    current["prev_installs"] = int(prev["installs"] * scale)
                    current["prev_bookings"] = int(prev["bookings"] * scale)
                    current["prev_video_views"] = int(prev.get("video_views", 0) * scale)
                    current["prev_video_completions"] = int(prev.get("video_completions", 0) * scale)
                    current["prev_cta_installs"] = int(prev.get("cta_installs", 0) * scale)
                    current["prev_cta_bookings"] = int(prev.get("cta_bookings", 0) * scale)
                else:
                    current["prev_spend"] = 0.0
                    current["prev_impressions"] = 0
                    current["prev_link_clicks"] = 0
                    current["prev_landing_page_views"] = 0
                    current["prev_installs"] = 0
                    current["prev_bookings"] = 0
                    current["prev_video_views"] = 0
                    current["prev_video_completions"] = 0
                    current["prev_cta_installs"] = 0
                    current["prev_cta_bookings"] = 0
                    
                final_rows.append(current)
                
            final_rows.sort(key=lambda r: (r["date_start"], r["market"], r["campaign"]), reverse=True)
            self.send_json_response(200, final_rows)
            
        except Exception as e:
            sys.stderr.write(f"Error fetching live performance: {str(e)}\n")
            self.send_json_response(500, {"error": f"Database error: {str(e)}"})

def run(port=8080):
    server_address = ('', port)
    httpd = http.server.HTTPServer(server_address, DashboardServerHandler)
    print(f"Starting server on port {port}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == '__main__':
    port = 8080
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    run(port)
