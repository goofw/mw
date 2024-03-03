curl -fsSL -o movie-web.zip https://github.com/movie-web/movie-web/releases/latest/download/movie-web.zip
unzip -q movie-web.zip && rm -f movie-web.zip
sed -i "s|VITE_CORS_PROXY_URL:.*,|VITE_CORS_PROXY_URL: \"$CORS_PROXY_URL\",|g" movie-web/config.js
sed -i "s|VITE_TMDB_READ_API_KEY:.*,|VITE_TMDB_READ_API_KEY: \"$TMDB_READ_API_KEY\",|g" movie-web/config.js
