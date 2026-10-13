# Umao Code Runner on AWS ECS/Fargate

These historical templates predate per-job Docker isolation and are not a verified deployment for the current supervisor. Do not deploy them unchanged or create paid AWS resources without the owner's approval.

The current supervisor needs a dedicated Docker-capable host. Ordinary Fargate does not provide its required Docker daemon; privileged containers are [not supported on Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-security-considerations.html). A future deployment needs an EC2-backed supervisor or a redesign scheduling each job as its own isolated task. See [current security and local setup requirements](../../docs/SECURITY.md).

Historical topology (not compatible with the current supervisor as written):

- Run `runner-service` as a private ECS/Fargate service in private subnets.
- Do not attach a public load balancer to the runner.
- Let the Next.js application call the runner through private service discovery or an internal load balancer.
- Set `CODE_RUNNER_SERVICE_URL` only in the Next.js production environment.
- Store `CODE_RUNNER_SERVICE_TOKEN` and `RUNNER_SHARED_TOKEN` in AWS Secrets Manager or the deployment platform secret store.
- Send runner logs to CloudWatch using the task definition `awslogs` config.

Required AWS pieces before deployment:

- ECR repository for `umao-code-runner`.
- ECS cluster.
- Private subnets and security groups that allow only the Next.js service to call runner port `8080`.
- CloudWatch log group `/ecs/umao-code-runner`.
- Secrets Manager secret for the shared runner token.
- Task execution role with ECR pull and CloudWatch Logs permissions.

Local Docker:

```bash
docker compose -f docker-compose.runner.yml up --build
CODE_RUNNER_SERVICE_URL=http://localhost:8080 CODE_RUNNER_SERVICE_TOKEN=local-dev-runner-token npm run dev
```
