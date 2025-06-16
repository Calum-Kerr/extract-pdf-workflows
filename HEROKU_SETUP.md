# 🚀 Heroku Deployment Setup for PDF Pro

## ✅ **Heroku App Created Successfully**

- **App Name**: `pdf-pro-app`
- **Region**: US
- **URL**: https://pdf-pro-app-eec1bc3e3c69.herokuapp.com/
- **Git Remote**: https://git.heroku.com/pdf-pro-app.git

## 📋 **Environment Variables Setup**

### **Already Configured:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL` = https://rkzuhlcoqzjvgfgxzawo.supabase.co
- ✅ `NEXT_PUBLIC_APP_URL` = https://pdf-pro-app-eec1bc3e3c69.herokuapp.com
- ✅ Node.js buildpack configured

### **Required Environment Variables to Add:**

You need to add these environment variables to complete the setup. Run these commands:

```bash
# Supabase Configuration
heroku config:set NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key --app pdf-pro-app
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key --app pdf-pro-app

# Stripe Configuration
heroku config:set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key --app pdf-pro-app
heroku config:set STRIPE_SECRET_KEY=your_stripe_secret_key --app pdf-pro-app
heroku config:set STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret --app pdf-pro-app

# Stripe Price IDs
heroku config:set STRIPE_PRO_PRICE_ID=your_pro_price_id --app pdf-pro-app
heroku config:set STRIPE_ENTERPRISE_PRICE_ID=your_enterprise_price_id --app pdf-pro-app

# Security
heroku config:set NEXTAUTH_SECRET=$(openssl rand -base64 32) --app pdf-pro-app
heroku config:set NEXTAUTH_URL=https://pdf-pro-app-eec1bc3e3c69.herokuapp.com --app pdf-pro-app

# Optional: Analytics & Monitoring
heroku config:set GOOGLE_SITE_VERIFICATION=your_google_verification --app pdf-pro-app
```

## 🔑 **Getting Your Supabase Keys**

1. Go to your Supabase project: https://rkzuhlcoqzjvgfgxzawo.supabase.co
2. Navigate to **Settings** → **API**
3. Copy the following keys:
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

## 💳 **Setting Up Stripe**

1. Create a Stripe account at https://stripe.com
2. Go to **Developers** → **API Keys**
3. Copy your keys:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

4. Create products and prices:
   - **Pro Plan**: $9.99/month
   - **Enterprise Plan**: $49.99/month
   - Copy the price IDs for the environment variables

5. Set up webhook endpoint:
   - URL: `https://pdf-pro-app-eec1bc3e3c69.herokuapp.com/api/webhooks/stripe`
   - Events: `customer.subscription.*`, `invoice.payment_succeeded`, `invoice.payment_failed`

## 🗄️ **Database Setup**

Run the database schema on your Supabase project:

```sql
-- Copy and run the contents of database/supabase-schema.sql
-- in your Supabase SQL editor
```

## 📦 **Deployment Commands**

Once all environment variables are set:

```bash
# Deploy to Heroku
git add .
git commit -m "Initial deployment to Heroku"
git push heroku main

# Check deployment status
heroku logs --tail --app pdf-pro-app

# Open your app
heroku open --app pdf-pro-app
```

## 🔧 **Heroku App Management**

```bash
# View app info
heroku info --app pdf-pro-app

# View environment variables
heroku config --app pdf-pro-app

# View logs
heroku logs --app pdf-pro-app

# Scale dynos (if needed)
heroku ps:scale web=1 --app pdf-pro-app

# Restart app
heroku restart --app pdf-pro-app
```

## 🚀 **Post-Deployment Checklist**

After deployment, verify:

- [ ] App loads at https://pdf-pro-app-eec1bc3e3c69.herokuapp.com
- [ ] User registration works
- [ ] PDF upload functionality works
- [ ] Stripe checkout flow works
- [ ] Database connections are working
- [ ] File storage is working

## 🔒 **Security Configuration**

1. **Supabase RLS**: Ensure Row Level Security is enabled
2. **CORS**: Configure allowed origins in Supabase
3. **Stripe Webhooks**: Verify webhook signatures
4. **Environment Variables**: Never commit secrets to git

## 📊 **Monitoring & Analytics**

Consider adding:
- **Heroku Metrics**: Monitor app performance
- **Sentry**: Error tracking
- **Google Analytics**: User analytics
- **Stripe Dashboard**: Payment monitoring

## 🆘 **Troubleshooting**

Common issues and solutions:

1. **Build Failures**: Check `heroku logs --tail`
2. **Database Connection**: Verify Supabase keys
3. **Payment Issues**: Check Stripe configuration
4. **File Upload Issues**: Verify Supabase storage setup

## 📞 **Support**

If you encounter issues:
1. Check Heroku logs: `heroku logs --app pdf-pro-app`
2. Verify environment variables: `heroku config --app pdf-pro-app`
3. Check Supabase project status
4. Verify Stripe webhook configuration

---

## 🎯 **Next Steps**

1. **Add all required environment variables** using the commands above
2. **Set up your Supabase database** using the schema file
3. **Configure Stripe** products and webhooks
4. **Deploy the application** with `git push heroku main`
5. **Test all functionality** end-to-end

Your PDF Pro application is ready for deployment! 🚀
