import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// Track recent clicks to prevent duplicates
const recentClicks = new Map();

async function getGeoLocation(ip) {
  // Skip for local IPs
  if (ip === 'unknown' || ip === '127.0.0.1' || ip.startsWith('192.168')) {
    return { country: 'Local', city: 'Local' };
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        country: data.country || 'Unknown',
        city: data.city || 'Unknown'
      };
    }
  } catch (error) {
    console.error('Geo lookup error:', error);
  }
  
  return { country: 'Unknown', city: 'Unknown' };
}

export async function GET(request, context) {
  const params = await context.params;
  const shortcode = params.shortcode;
  
  try {
    // Get the link from database
    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('*')
      .eq('short_code', shortcode)
      .single();
    
    if (linkError || !link) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    if (!link.active) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Extract tracking data
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Create unique identifier for this click
    const clickKey = `${link.id}-${ip}`;
    const lastClick = recentClicks.get(clickKey);
    const now = Date.now();
    
    if (!lastClick || (now - lastClick) > 2000) {
      // Track this click
      recentClicks.set(clickKey, now);
      
      // Clean up old entries
      for (const [key, timestamp] of recentClicks.entries()) {
        if (now - timestamp > 5000) {
          recentClicks.delete(key);
        }
      }
      
      const referrer = request.headers.get('referer') || 'direct';
      const deviceType = userAgent.match(/Mobile|Android|iPhone|iPad/i) ? 'mobile' : 'desktop';
      const browser = userAgent.match(/Chrome|Safari|Firefox|Edge/i)?.[0] || 'unknown';
      const os = userAgent.match(/Windows|Mac|Linux|Android|iOS/i)?.[0] || 'unknown';
      
      // Get geo-location
      const geo = await getGeoLocation(ip);
      
      // Insert click record with geo data
      await supabase
        .from('clicks')
        .insert([
          {
            link_id: link.id,
            ip_address: ip,
            device_type: deviceType,
            browser: browser,
            os: os,
            referrer: referrer,
            user_agent: userAgent,
            country: geo.country,
            city: geo.city
          }
        ]);
      
      // Update total clicks count
      await supabase
        .from('links')
        .update({ total_clicks: link.total_clicks + 1 })
        .eq('id', link.id);
      
      console.log(`Click tracked: ${shortcode} - ${geo.city}, ${geo.country}`);
    }
    
    // Always redirect
    return NextResponse.redirect(link.destination_url);
    
  } catch (error) {
    console.error('Redirect error:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}