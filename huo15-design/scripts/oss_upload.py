import os, sys, oss2, mimetypes
kid=os.environ["OSS_KEY_ID"]; ksec=os.environ["OSS_KEY_SECRET"]
endpoint=os.environ["OSS_ENDPOINT"]; bucket_name=os.environ["OSS_BUCKET"]
fpath=sys.argv[1]; key=sys.argv[2]
auth=oss2.Auth(kid, ksec)
bucket=oss2.Bucket(auth, endpoint, bucket_name)
size=os.path.getsize(fpath)
def cb(c,t):
    pct=c*100//t if t else 0
    sys.stderr.write(f"\r  上传 {pct}% ({c//1048576}/{t//1048576} MB)"); sys.stderr.flush()
ctype = mimetypes.guess_type(fpath)[0] or "application/octet-stream"
headers={"x-oss-object-acl":"public-read","Content-Type":ctype}
oss2.resumable_upload(bucket, key, fpath, headers=headers, num_threads=4,
                      part_size=4*1024*1024, progress_callback=cb)
sys.stderr.write("\n")
# 构造返回地址
host=endpoint.replace("https://","").replace("http://","")
url=f"https://{bucket_name}.{host}/{key}"
print(url)
