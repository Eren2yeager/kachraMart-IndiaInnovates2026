# Fix: Google Directions API REQUEST_DENIED Error

## The Problem

You're getting this error:
```
API keys with referer restrictions cannot be used with this API.
```

**Why?** Your API key has HTTP referrer restrictions (for browser security), but the Directions API is being called from your Next.js server-side API routes, which don't send referrer headers.

## Solution Options

### Option 1: Quick Fix (Development Only) ⚡

**Remove referer restrictions temporarily:**

1. Go to [Google Cloud Console - API Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your API key: `AIzaSyAc1k6x-tRDlH5Ge3plE8BjpFzk4wXC5_0`
3. Under "Application restrictions", select **"None"**
4. Click "Save"
5. Restart your dev server: `npm run dev`

⚠️ **Warning**: This makes your key less secure. Only use for development!

---

### Option 2: Proper Fix (Recommended for Production) 🔒

**Create separate keys for browser and server:**

#### Step 1: Create a Server-Side API Key

1. Go to [Google Cloud Console - API Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **"Create Credentials"** → **"API Key"**
3. A new key will be created. Click **"Edit API Key"**
4. Name it: `KachraMart Server-Side Key`

5. **Set Application Restrictions:**
   - Select **"IP addresses"**
   - For development: Leave empty or add `0.0.0.0/0` (allows all IPs)
   - For production: Add your server's IP address

6. **Set API Restrictions:**
   - Select **"Restrict key"**
   - Enable these APIs only:
     - ✅ Directions API
     - ✅ Geocoding API
   - Click "Save"

7. **Copy the new API key**

#### Step 2: Configure Your Client-Side Key

1. Go back to your existing key: `AIzaSyAc1k6x-tRDlH5Ge3plE8BjpFzk4wXC5_0`
2. Click "Edit"
3. Name it: `KachraMart Client-Side Key`

4. **Set Application Restrictions:**
   - Select **"HTTP referrers (web sites)"**
   - Add these referrers:
     ```
     http://localhost:3000/*
     https://yourdomain.com/*
     ```

5. **Set API Restrictions:**
   - Select **"Restrict key"**
   - Enable these APIs only:
     - ✅ Maps JavaScript API
     - ✅ Places API
     - ✅ Geocoding API (for client-side address search)
   - Click "Save"

#### Step 3: Update Your .env.local

Open `.env.local` and update it like this:

```bash
# Google Maps API Keys
# Client-side key (with HTTP referrer restrictions for browser use)
NEXT_PUBLIC_GOOGLE_MAP_API_KEY=AIzaSyAc1k6x-tRDlH5Ge3plE8BjpFzk4wXC5_0

# Server-side key (with IP restrictions for API routes)
GOOGLE_MAP_API_KEY=YOUR_NEW_SERVER_SIDE_KEY_HERE
```

Replace `YOUR_NEW_SERVER_SIDE_KEY_HERE` with the server-side key you created in Step 1.

#### Step 4: Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

---

## How the Keys Are Used

### Client-Side Key (`NEXT_PUBLIC_GOOGLE_MAP_API_KEY`)
Used by:
- `GoogleMapProvider` component (loads Maps JavaScript API)
- Browser-side map rendering
- Client-side geocoding (address search)

**Restrictions**: HTTP referrers (your website domains)

### Server-Side Key (`GOOGLE_MAP_API_KEY`)
Used by:
- `/api/maps/route` (Directions API)
- `/api/maps/geocode` (Geocoding API)
- `/api/maps/reverse-geocode` (Reverse Geocoding API)

**Restrictions**: IP addresses (your server IPs)

---

## Verify It's Working

### Test 1: Check Environment Variables

```bash
# In your project directory
cat .env.local | grep GOOGLE_MAP_API_KEY
```

You should see TWO different keys:
```
GOOGLE_MAP_API_KEY=server-side-key
NEXT_PUBLIC_GOOGLE_MAP_API_KEY=client-side-key
```

### Test 2: Test the API Route

```powershell
# Run the API test script
.\test-maps-api.ps1
```

You should see:
```
✅ Route calculation successful
   Distance: X.XX km
   Duration: XX minutes
```

### Test 3: Test in Browser

1. Go to `http://localhost:3000/test-maps`
2. Open browser console (F12)
3. You should see:
   - ✅ Maps load without errors
   - ✅ No "REQUEST_DENIED" errors
   - ✅ Route calculations work

---

## Troubleshooting

### Still getting REQUEST_DENIED?

1. **Wait 5 minutes** - API key changes can take a few minutes to propagate
2. **Clear browser cache** - Old API responses might be cached
3. **Restart dev server** - Ensure new environment variables are loaded
4. **Check API is enabled**:
   - Go to [Google Cloud Console - APIs](https://console.cloud.google.com/apis/library)
   - Search for "Directions API"
   - Ensure it's **ENABLED**

### Maps don't load in browser?

1. Check that `NEXT_PUBLIC_GOOGLE_MAP_API_KEY` is set correctly
2. Verify HTTP referrer restrictions include `http://localhost:3000/*`
3. Check browser console for specific error messages

### API routes still fail?

1. Verify `GOOGLE_MAP_API_KEY` (without NEXT_PUBLIC) is set
2. Check that Directions API is enabled in Google Cloud Console
3. Ensure the server-side key has no HTTP referrer restrictions

---

## Quick Reference

| Use Case | Environment Variable | Restrictions |
|----------|---------------------|--------------|
| Browser maps | `NEXT_PUBLIC_GOOGLE_MAP_API_KEY` | HTTP referrers |
| API routes | `GOOGLE_MAP_API_KEY` | IP addresses or None |

---

## Security Best Practices

✅ **Do:**
- Use separate keys for client and server
- Restrict client key to your domains
- Restrict server key to your server IPs
- Keep server key secret (never expose in browser)

❌ **Don't:**
- Use the same key for both client and server
- Leave keys unrestricted in production
- Commit API keys to version control
- Share API keys publicly

---

## Need Help?

If you're still having issues:

1. Check the [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
2. Verify your API keys in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
3. Check that all required APIs are enabled
4. Review the error messages in your terminal and browser console

---

**Recommended Next Step**: Use Option 1 (Quick Fix) to test immediately, then implement Option 2 before deploying to production.
