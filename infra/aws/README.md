# Umao Code Runner on AWS ECS/Fargate

This folder contains deployment-ready configuration templates only. Do not create AWS resources until the owner approves the deployment plan and cost.

Recommended production topology:

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
