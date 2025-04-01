# apache-arrow-format-in-groonga-example

## 試す

```bash
git clone https://github.com/abetomo/apache-arrow-format-in-groonga-example.git
cd apache-arrow-format-in-groonga-example
```

```bash
docker image build -t groonga-example .
docker container run -d --rm --name groonga-example groonga-example
docker container exec groonga-example node /app/main.mjs
docker container kill groonga-example
```
