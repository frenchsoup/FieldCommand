#!/bin/bash

# Substitute variables in index.html
sed -i "s|\[FIREBASE_API_KEY\]|${FIREBASE_API_KEY}|g" public/index.html
sed -i "s|\[FIREBASE_AUTH_DOMAIN\]|${FIREBASE_AUTH_DOMAIN}|g" public/index.html
sed -i "s|\[FIREBASE_PROJECT_ID\]|${FIREBASE_PROJECT_ID}|g" public/index.html
sed -i "s|\[FIREBASE_STORAGE_BUCKET\]|${FIREBASE_STORAGE_BUCKET}|g" public/index.html
sed -i "s|\[FIREBASE_MESSAGING_SENDER_ID\]|${FIREBASE_MESSAGING_SENDER_ID}|g" public/index.html
sed -i "s|\[FIREBASE_APP_ID\]|${FIREBASE_APP_ID}|g" public/index.html
sed -i "s|\[FIREBASE_MEASUREMENT_ID\]|${FIREBASE_MEASUREMENT_ID}|g" public/index.html
sed -i "s|\[STRIPE_PUBLIC_KEY\]|${STRIPE_PUBLIC_KEY}|g" public/index.html

# Substitute variables in init.js
sed -i "s|\[FIREBASE_API_KEY\]|${FIREBASE_API_KEY}|g" public/js/init.js
sed -i "s|\[FIREBASE_AUTH_DOMAIN\]|${FIREBASE_AUTH_DOMAIN}|g" public/js/init.js
sed -i "s|\[FIREBASE_PROJECT_ID\]|${FIREBASE_PROJECT_ID}|g" public/js/init.js
sed -i "s|\[FIREBASE_STORAGE_BUCKET\]|${FIREBASE_STORAGE_BUCKET}|g" public/js/init.js
sed -i "s|\[FIREBASE_MESSAGING_SENDER_ID\]|${FIREBASE_MESSAGING_SENDER_ID}|g" public/js/init.js
sed -i "s|\[FIREBASE_APP_ID\]|${FIREBASE_APP_ID}|g" public/js/init.js
sed -i "s|\[FIREBASE_MEASUREMENT_ID\]|${FIREBASE_MEASUREMENT_ID}|g" public/js/init.js
sed -i "s|\[STRIPE_PUBLIC_KEY\]|${STRIPE_PUBLIC_KEY}|g" public/js/init.js

# Verify substitution by copying the modified file
cp public/js/init.js public/js/init-substituted.js

# Log the substituted values for debugging
echo "Substituted FIREBASE_API_KEY: ${FIREBASE_API_KEY}" > build.log
echo "Substituted STRIPE_PUBLIC_KEY: ${STRIPE_PUBLIC_KEY}" >> build.log