FROM nginx:stable-alpine

# Use official nginx base image
COPY nginx.conf /etc/nginx/nginx.conf

# Remove any default upstream config provided by the base image so it doesn't override our site configs
RUN rm -f /etc/nginx/conf.d/default.conf || true

# Copy our site configs into the container
COPY conf.d /etc/nginx/conf.d

# Ensure there is no leftover default.conf after copy (protect against base image or earlier layers)
RUN rm -f /etc/nginx/conf.d/default.conf || true

# Optionally, if you want the production file to be the canonical default filename used by nginx,
# uncomment the following line to rename production.conf -> default.conf inside the image.
# RUN if [ -f /etc/nginx/conf.d/production.conf ]; then mv /etc/nginx/conf.d/production.conf /etc/nginx/conf.d/default.conf; fi
