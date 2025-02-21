# app/services/email_service.py
import boto3
import os
from botocore.exceptions import ClientError
from jinja2 import Environment, FileSystemLoader
from fastapi import BackgroundTasks, HTTPException

class EmailService:
    def __init__(self):
        """
        Initialize the EmailService with credentials from environment variables.
        """
        self.aws_access_key = os.getenv("AWS_ACCESS_KEY")
        self.aws_secret_key = os.getenv("AWS_SECRET_KEY")
        self.region = os.getenv("AWS_REGION", "us-east-1")
        self.source_email = os.getenv("SOURCE_EMAIL", "no-reply@thamerweb.com")

        if not all([self.aws_access_key, self.aws_secret_key, self.region, self.source_email]):
            raise ValueError("Missing required environment variables for email service.")

        self.client = boto3.client(
            "ses",
            aws_access_key_id=self.aws_access_key,
            aws_secret_access_key=self.aws_secret_key,
            region_name=self.region,
        )

        # Initialize Jinja2 template environment
        self.template_env = Environment(loader=FileSystemLoader("app/templates/email/"))


    def render_template(self, template_name: str, context: dict) -> str:
        """
        Render an HTML template with the given context.
        """
        template = self.template_env.get_template(template_name)
        return template.render(context)

    def send_email(
        self,
        to_email: str,
        subject: str,
        template_name: str = None,  # Allow sending plain text emails
        context: dict = None,
        background_tasks: BackgroundTasks = None,
    ):
        """
        Send an email using AWS SES with a rendered template.
        """

        print(f"EmailService: Sending email to {to_email} with subject '{subject}'")
        print(f"Context: {context}")
        print(f"Background tasks: {background_tasks}")

        # html_content = self.render_template(template_name, context)
        # Prepare email content
        if template_name:
            # Render HTML email using a template
            html_content = self.render_template(template_name, context or {})
        else:
            # Use plain text if no template is provided
            html_content = context.get("message", "No content provided.")


        def send():
            try:
                response = self.client.send_email(
                    Source=self.source_email,  # Fixed this attribute
                    Destination={"ToAddresses": [to_email]},
                    Message={
                        "Subject": {"Data": subject},
                        "Body": {"Html": {"Data": html_content}},
                    },
                )
                print(f"Email sent! Message ID: {response['MessageId']}")
            except ClientError as e:
                print(f"Error sending email: {e}")
                raise HTTPException(status_code=500, detail="Failed to send email.")

        # Schedule the email sending as a background task
        if background_tasks:
            background_tasks.add_task(send)
        else:
            send()
    