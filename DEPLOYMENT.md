# Medical Counselling Intelligence Platform - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Medical Counselling Intelligence Platform to Cloudflare Pages and GitHub Pages.

## Prerequisites

- GitHub account
- Cloudflare account
- Node.js 16+ installed locally
- Git installed locally

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/medical-counselling-platform.git
cd medical-counselling-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Local Development Server

```bash
npm start
```

The application will be available at `http://localhost:8080`

## Deployment to Cloudflare Pages

### 1. Create Cloudflare Account

1. Go to [Cloudflare](https://cloudflare.com)
2. Sign up for a free account
3. Verify your email address

### 2. Set Up Cloudflare Pages

1. Log in to your Cloudflare dashboard
2. Navigate to "Pages" in the sidebar
3. Click "Create a project"
4. Choose "Connect to Git"
5. Select your GitHub repository
6. Configure build settings:
   - **Build command**: Leave empty (static site)
   - **Build output directory**: Leave empty (root directory)
   - **Root directory**: Leave empty
7. Click "Save and Deploy"

### 3. Configure Environment Variables

In your Cloudflare Pages project settings, add these environment variables:

```
NODE_VERSION=18
```

### 4. Set Up Custom Domain (Optional)

1. In your Cloudflare Pages project settings
2. Go to "Custom domains"
3. Add your domain
4. Follow the DNS configuration instructions

## Deployment to GitHub Pages

### 1. Enable GitHub Pages

1. Go to your GitHub repository
2. Navigate to "Settings" > "Pages"
3. Under "Source", select "GitHub Actions"
4. This will use the workflow defined in `.github/workflows/deploy.yml`

### 2. Configure Repository Secrets

For the GitHub Actions workflow to work properly, you need to set up these secrets:

1. Go to your repository settings
2. Navigate to "Secrets and variables" > "Actions"
3. Add the following secrets:

#### Required Secrets:

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

#### How to Get Cloudflare Credentials:

1. **API Token**:
   - Go to Cloudflare dashboard
   - Navigate to "My Profile" > "API Tokens"
   - Click "Create Token"
   - Use "Custom token" template
   - Add permissions: "Cloudflare Pages" (Edit)
   - Copy the generated token

2. **Account ID**:
   - Go to Cloudflare dashboard
   - Look at the URL: `https://dash.cloudflare.com/<account-id>`
   - Copy the account ID from the URL

## Automated Deployment

The project includes a GitHub Actions workflow that automatically:

1. Validates HTML
2. Checks for broken links
3. Runs Lighthouse audit
4. Deploys to Cloudflare Pages
5. Deploys to GitHub Pages
6. Uploads performance reports

### Workflow Triggers

- **Push to main branch**: Automatic deployment
- **Pull requests**: Validation and testing only

## Manual Deployment

### Option 1: Using Cloudflare CLI

```bash
# Install Cloudflare CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy to Cloudflare Pages
wrangler pages publish . --project-name=medical-counselling-platform
```

### Option 2: Using GitHub CLI

```bash
# Install GitHub CLI
# Follow instructions at: https://cli.github.com/

# Create a release
gh release create v1.0.0 --title "Initial Release" --notes "First deployment"

# Deploy to GitHub Pages
gh repo deploy
```

## Performance Optimization

### 1. Image Optimization

- Use WebP format for images
- Implement lazy loading
- Compress images before upload

### 2. Caching Strategy

The service worker implements:
- Static assets: Cache-first
- Data files: Network-first with cache fallback
- API requests: Network-first with cache fallback

### 3. CDN Configuration

Cloudflare Pages automatically provides:
- Global CDN
- Edge caching
- DDoS protection
- SSL/TLS encryption

## Monitoring and Analytics

### 1. Cloudflare Analytics

1. Enable Cloudflare Web Analytics
2. Add the tracking code to your HTML
3. Monitor performance metrics

### 2. Google Analytics

1. Create a Google Analytics account
2. Add the tracking code to your HTML
3. Set up custom events for user interactions

### 3. Error Monitoring

Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Hotjar for user behavior analysis

## Security Considerations

### 1. Content Security Policy

Add CSP headers to prevent XSS attacks:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;">
```

### 2. HTTPS Enforcement

Cloudflare Pages automatically provides HTTPS. Ensure:
- All external resources use HTTPS
- No mixed content warnings
- HSTS headers are enabled

### 3. Data Privacy

- Implement GDPR compliance
- Add privacy policy
- Cookie consent management
- Data anonymization

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for syntax errors in JavaScript

2. **Deployment Issues**:
   - Verify Cloudflare credentials
   - Check repository permissions
   - Review GitHub Actions logs

3. **Performance Issues**:
   - Run Lighthouse audit
   - Optimize images
   - Minimize JavaScript bundles
   - Enable compression

### Debug Commands

```bash
# Validate HTML
npm run lint

# Run Lighthouse audit
npm run lighthouse

# Check broken links
npx broken-link-checker --recursive

# Test PWA functionality
npx lighthouse --output=json --chrome-flags="--headless"
```

## Maintenance

### Regular Tasks

1. **Weekly**:
   - Check for broken links
   - Review performance metrics
   - Update dependencies

2. **Monthly**:
   - Run security audits
   - Update data files
   - Review analytics

3. **Quarterly**:
   - Major dependency updates
   - Performance optimization
   - Feature updates

### Backup Strategy

1. **Code Backup**:
   - GitHub repository
   - Local development copy
   - Cloudflare Pages backup

2. **Data Backup**:
   - JSON data files in repository
   - Database exports
   - Cloudflare cache

## Support

For deployment issues:

1. Check the GitHub Actions logs
2. Review Cloudflare Pages logs
3. Consult the troubleshooting section
4. Create an issue in the repository

## Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [Performance Optimization](https://web.dev/performance/)