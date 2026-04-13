# 获取阿里云OSS Token

## 接口地址

https://zytestaliyun.ceshiservice.cn/api-dihw-smarthw/token/uploadTokenNew?type=pyjLog&path=pyjLog&schoolId=1500000200068840595

## 返回示例

```JSON
{
	"result": "success",
	"message": {
		"accessKeyId": "STS.NZYchDoiijqs7HkPkHRGjWUDY",
		"accessKeySecret": "2oFx1Yts4sKKWGxhvNcUcr9NyYSrqq3sLKhkgvHfudSN",
		"bucket": "zhixuetest-gc-bj",
		"cname": false,
		"endPoint": "oss-cn-beijing.aliyuncs.com",
		"expiration": "2026-04-11T10:51:39Z",
		"path": "school-book-test/pyjLog/2026/04/11",
		"provider": "aliyun",
		"region": "cn-beijing",
		"securityToken": "CAISwwN1q6Ft5B2yfSjIr5nsKNLwgrZI3bOYNW7atGsdXshGuJDvuzz2IHlJdHVvBeAWsfowmm1U6fYclqZvRZUAXkfEasx0q55Q9gD5kQsFMnPuv9I+k5SANTW5oHeZtZagtoybIfrZfvCyER+m8gZ43br9cxi7QlWhKufnoJV7b9MRLG7aCD1dH4VuOxdFos0XPmer15/PVCTnmW3NFkFllxNhgGdkk8SFz9ab9wDVgS/8qLMcrJ+jJYO/PYs+fsVtU9alweFqe7HdlSFbrhJIs7x9jKtD/XLNudaeRkVc+AnBK/vW1tpgTlFwbbNoHLVf/rqu169quu3Dionrxg1ReO5eFi7dA5urwMzDHKajMdE6MKr2IGiKysGNEp769EEGGStBb1wbJYRwdy4gVk11GmDgR/X5qAyQUGCKULOY1aw6651xwmjz8MCCT1r1GOzEgXpHZs9sMB13aUNKgjy/aMgceglQfkh7Dq6NUp9ycB1OVAMMcq8Hp0eKp1AgXJ2WD5u+0sh34nVCRQvQzIFUohgSBqeW65BTn67v6yFaPSUuYv0Nu5K2WoSU45zeu57oSo2rZL15/DsTH1/fx8/PKbsNRUWZGoABApBn/BU9oFp3zcLQi7hFPMX9TraUI1rcfEY7nOpp10vEMT5g4r+PmLg8BUA/vBN4DH2wSeVkMJvaiJ1bvFokfFd9ghZgA3KJFP7lM9s6TR5tDvwd1/OUukP+9fZuAL/yefV6hj4FUOKxDT4pXN24w9FgLsxDdqlUV6XKIgVKFL8gAA=="
	}
}
```

**备注**：接口实际返回的数据中，message 字段值是JOSN字符串，这里为方便展示所有字段，以JSON格式展示
