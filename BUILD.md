#### Docker 构建部署推送命令

构建镜像并标记为 1.0.4：

```bash
docker build -t zkeq/self-music:1.0.4 .
```

标记为 latest：

```bash
docker tag zkeq/self-music:1.0.4 zkeq/self-music:latest

docker tag zkeq/self-music:1.0.4 docker.cnb.cool/onmicrosoft/self-music:1.0.4

docker tag zkeq/self-music:1.0.4 docker.cnb.cool/onmicrosoft/self-music:latest
```


推送 1.0.4 版本：

```bash
docker push zkeq/self-music:1.0.4
docker push docker.cnb.cool/onmicrosoft/self-music:1.0.4
```


推送 latest 版本：

```bash
docker push zkeq/self-music:latest
docker push docker.cnb.cool/onmicrosoft/self-music:latest
```