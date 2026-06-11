import os
import json
from datetime import datetime, timedelta
from google.cloud import bigquery

# Set Google Application Credentials
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/lorik/.gemini/antigravity/profile_configs/Dept/service-account.json"

def normalize_market(m):
    if not m:
        return "ES"
    m_upper = m.upper()
    if '6982545611807555586' in m_upper or 'FR' in m_upper or 'LAFOURCHETTE' in m_upper:
        return 'FR'
    if '6982545462632906753' in m_upper or 'ES' in m_upper:
        return 'ES'
    if '7015602279810138113' in m_upper or 'GB' in m_upper or 'UNITED KINGDOM' in m_upper or 'CO.UK' in m_upper:
        return 'UK'
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
    return day

def fetch_and_process_platform(table_name, output_filename, is_tiktok=False):
    client = bigquery.Client(project="byte-data-management")
    
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
    WHERE day >= '2026-04-11'
    ORDER BY day ASC
    """
    
    print(f"Fetching rows from BigQuery for {table_name}...")
    query_job = client.query(query)
    rows = list(query_job.result())
    print(f"Fetched {len(rows)} raw rows for {table_name}.")
    max_day = max(coerce_day(row.day) for row in rows) if rows else None
    
    # Group daily records
    groups = {}
    
    for row in rows:
        day_date = coerce_day(row.day)
            
        # Get Monday of the week
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

    # Let's collect weekly metrics
    weekly_data = {}
    
    for key, daily_rows in groups.items():
        week_start_str, m, obj, tgt, cmp, campaign_name, ad_name = key
        
        # Calculate week start & end date objects
        w_start = datetime.strptime(week_start_str, "%Y-%m-%d").date()
        w_end = w_start + timedelta(days=6)
        
        # Aggregate totals
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
        
        # Extract creative URLs
        creative_image_url = next((r.creative_image_url for r in daily_rows if r.creative_image_url), "")
        creative_thumbnail_url = next((r.creative_thumbnail_url for r in daily_rows if r.creative_thumbnail_url), "")
        creative_link = next((r.creative_link for r in daily_rows if r.creative_link), "")

        # Construct timeline arrays
        cost_timeline = [0.0] * 7
        impressions_timeline = [0.0] * 7
        
        for r in daily_rows:
            r_day = coerce_day(r.day)
            day_idx = (r_day - w_start).days
            if 0 <= day_idx < 7:
                cost_timeline[day_idx] += float(r.costs or 0.0)
                impressions_timeline[day_idx] += float(r.impressions or 0)
                
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
            "ad_name": ad_name,
            "creative_image_url": creative_image_url,
            "creative_thumbnail_url": creative_thumbnail_url,
            "creative_link": creative_link,
            "spend": spend,
            "impressions": impressions,
            "link_clicks": clicks,
            "landing_page_views": lpv,
            "video_views": video_views,
            "video_completions": video_completions,
            "installs": installs,
            "bookings": bookings,
            "cta_installs": cta_installs,
            "cta_bookings": cta_bookings,
            "cost_timeline": cost_timeline,
            "impressions_timeline": impressions_timeline
        }
        
    # Now compute previous week values
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
            # If not found, default to 0
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
        
    # Sort chronologically by date_start desc, then market, campaign
    final_rows.sort(key=lambda r: (r["date_start"], r["market"], r["campaign"]), reverse=True)
    
    # Save to file
    output_path = f"/Users/lorik/Documents/!Antigravity Project/Dept AG/The Fork/src/{output_filename}"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(final_rows, f, indent=2)
        
    print(f"Successfully wrote {len(final_rows)} processed rows to {output_path}.")
    return final_rows

def main():
    # 1. Process Meta data
    meta_rows = fetch_and_process_platform("the_fork_fb_ads_modeled", "data_meta.json", is_tiktok=False)
    
    # Write a copy to data.json (for backwards compatibility)
    output_path = "/Users/lorik/Documents/!Antigravity Project/Dept AG/The Fork/src/data.json"
    with open(output_path, "w") as f:
        json.dump(meta_rows, f, indent=2)
    print(f"Wrote compatible data copy to {output_path}")

    # 2. Process TikTok data
    fetch_and_process_platform("thefork_tiktok_ads_modeled", "data_tiktok.json", is_tiktok=True)

if __name__ == "__main__":
    main()
