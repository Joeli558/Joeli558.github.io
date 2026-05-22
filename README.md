# Binghong Li Academic Site

This is a static personal academic website for Binghong Li. It is designed to be public, open access, and indexable by search engines.

Public GitHub Pages domain:

```text
https://joeli558.github.io/
```

## Files

- `index.html`: page content and structure
- `styles.css`: responsive visual design
- `script.js`: paper filtering, mobile navigation, and theme toggle
- `assets/`: profile photo and visual assets
- `robots.txt`: allows public crawling
- `vercel.json`: simple static hosting configuration

## Admin

- Admin page: `admin.html`
- Password: `libinghong123`
- The admin can edit profile text, research interests, papers, education, and public files.
- On static hosting, admin changes are first saved to the current browser preview. Use `Export site-content.js`, replace `content/site-content.js`, and redeploy to make the changes public for all visitors.

## Background Images

- `assets/background-auditorium.jpg`: homepage hero background
- `assets/background-classroom.jpg`: education section and admin login background

## Public Access Notes

- The page uses public metadata and `robots.txt` allows indexing.
- There is no login, paywall, or private data requirement.
- Deploy the `academic-site` folder to the GitHub repository `Joeli558.github.io`.
- Contact email is set to `libinghong84@gmail.com`.

## Vercel Deployment

This workspace includes `scripts/deploy_academic_site_vercel.py`, which deploys the site through the Vercel REST API without requiring the local Vercel CLI.

Required:

- Set `VERCEL_TOKEN` in the shell environment.
- If deploying to a team, also set `VERCEL_TEAM_ID` or `VERCEL_TEAM_SLUG`.
- Provide the domain name when running the script.

Example:

```powershell
$env:VERCEL_TOKEN="..."
python scripts/deploy_academic_site_vercel.py --domain example.com --domain www.example.com
```
