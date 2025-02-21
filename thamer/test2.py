import boto3
ssm = boto3.client("ssm", region_name="us-east-1")

secret_key = ssm.get_parameter(Name="/myapp/secret_key", WithDecryption=True)["Parameter"]["Value"]
otp_secret_key = ssm.get_parameter(Name="/myapp/otp_secret_key", WithDecryption=True)["Parameter"]["Value"]

print("SECRET_KEY:", secret_key)
print("OTP_SECRET_KEY:", otp_secret_key)
