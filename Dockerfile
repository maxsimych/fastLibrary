FROM node
EXPOSE 442
WORKDIR /app
COPY . /app
RUN npm i
RUN npm i -g nodemon
CMD ["nodemon", "server.js"]