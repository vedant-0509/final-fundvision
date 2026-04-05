import asyncio
import httpx
from datetime import datetime
from sqlalchemy.dialects.mysql import insert
from backend.database import AsyncSessionLocal
from backend.models import Fund

async def sync_funds():
    print("🚀 Starting Fund Ingestion...")
    print("🌐 Connecting to AMFI to fetch latest Mutual Fund data...")
    
    url = "https://www.amfiindia.com/spages/NAVAll.txt"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
            response = await client.get(url, timeout=60.0)
            lines = response.text.splitlines()
        
        print(f"📊 Downloaded {len(lines)} lines. Parsing and saving to MySQL...")

        async with AsyncSessionLocal() as db:
            count = 0
            for line in lines:
                parts = [p.strip() for p in line.split(';')]
                
                # Check for 6-digit scheme code to identify data lines
                if len(parts) >= 5 and parts[0].isdigit():
                    scheme_code = parts[0]
                    name = parts[3]
                    nav_str = parts[4]
                    
                    try:
                        nav_val = float(nav_str) if nav_str and nav_str != 'N.A.' else 0.0
                    except ValueError:
                        nav_val = 0.0
                    
                    # Prepare data dictionary matching your models.py constraints
                    fund_data = {
                        "scheme_code": scheme_code,
                        "name": name[:200],           # Truncate to model limit
                        "nav": nav_val,
                        "fund_house": "ABSL"[:100],   # Default House
                        "category": "Debt"[:20],      # Truncate to 20 chars
                        "asset_type": "Debt"[:10],    # Truncate to 10 chars
                        "risk_level": "Moderate"[:10],# Truncate to 10 chars
                        "is_active": True,
                        "created_at": datetime.now(),
                        "updated_at": datetime.now()
                    }

                    # MySQL Upsert: Insert new, or update NAV if scheme_code exists
                    stmt = insert(Fund).values(**fund_data)
                    stmt = stmt.on_duplicate_key_update(
                        nav=stmt.inserted.nav,
                        updated_at=datetime.now()
                    )
                    
                    await db.execute(stmt)
                    count += 1
                    
                    # Commit in batches of 500 for performance
                    if count % 500 == 0:
                        await db.commit()
                        print(f"💾 Processed {count} funds...")
            
            await db.commit()
            print(f"✅ FINAL SUCCESS! Processed {count} funds into your database.")

    except Exception as e:
        print(f"❌ ERROR DURING INGESTION: {str(e)}")

if __name__ == "__main__":
    asyncio.run(sync_funds())