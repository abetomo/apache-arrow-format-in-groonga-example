FROM groonga/groonga:latest-debian

# groonga/groonga:latest-debianイメージにアプリケーションを追加する方法は良くない。
# Docker ComposeなどでGroongaサーバコンテナとアプリケーションのコンテナは分けるのがベスト。
# 今回はお手軽に試すということでこのような方法にしている。

WORKDIR /app

RUN apt update && apt install -y -V curl
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
RUN apt install -y -V nodejs
RUN npm install apache-arrow
COPY main.mjs main.mjs
