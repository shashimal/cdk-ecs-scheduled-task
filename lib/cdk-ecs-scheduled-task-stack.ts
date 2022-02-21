import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {InstanceType, NatProvider, SubnetType, Vpc} from "aws-cdk-lib/aws-ec2";
import {Cluster, ContainerImage, FargatePlatformVersion, LogDriver} from "aws-cdk-lib/aws-ecs";
import {ScheduledFargateTask} from "aws-cdk-lib/aws-ecs-patterns";
import {Repository} from "aws-cdk-lib/aws-ecr";
import {Schedule} from "aws-cdk-lib/aws-events";

export class CdkEcsScheduledTaskStack extends Stack {

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        //Creating the VPC
        const vpc = new Vpc(this, 'VPCForECS', {
            maxAzs: 2,
            natGatewayProvider: NatProvider.instance({
                instanceType: new InstanceType('t2.micro'),
            })
        });

        //Creating the ECS cluster
        const cluster = new Cluster(this, 'ECSCluster', {
            vpc
        });

        //Creating a Fargate schedueld task
        const scheduledTask = new ScheduledFargateTask(this, 'ScheduledTask', {
            cluster: cluster,
            platformVersion: FargatePlatformVersion.LATEST,
            desiredTaskCount: 2,
            schedule: Schedule.expression('cron(0/10 * * * ? *)'),
            subnetSelection: {subnetType: SubnetType.PRIVATE_WITH_NAT},
            scheduledFargateTaskImageOptions: {
                image: ContainerImage.fromEcrRepository(Repository.fromRepositoryName(this, `ECR-Image`, 'test-cron-job')),
                memoryLimitMiB: 512,
                cpu: 256,
                command: ['node', 'app.js'],
                logDriver: LogDriver.awsLogs({streamPrefix: 'ScheduledTaskLogs'})
            }
        });
    }
}
