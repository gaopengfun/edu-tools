# 腾讯翻译中转接入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将单词听写工具的翻译能力从前端直调有道切换为 Java 后端中转腾讯云机器翻译，并提供单条与批量两个接口。

**Architecture:** 前端保留 `src/utils/translate.ts` 作为唯一翻译门面，但内部改为请求 `blog-svc-springboot` 的 `/api-blog/translate/word` 与 `/api-blog/translate/batch`。Java 后端新增翻译配置、鉴权校验、腾讯云 TMT SDK 调用与统一响应 DTO，前端不再持有翻译平台密钥，也不再依赖 Vite 翻译代理。

**Tech Stack:** Vue 3 + TypeScript + Pinia + Vite 8, Spring Boot 2.3, Maven, JUnit 4, MockMvc, Tencent Cloud Java SDK (TMT)

---

## File structure

### Frontend repo: `D:/project/myself/edu-tools`
- Modify: `src/utils/translate.ts` — 将有道实现替换为调用 Java 后端的翻译门面
- Modify: `vite.config.ts` — 删除 `/api/translate` 的有道代理
- Modify: `.env.local` — 删除有道变量，新增 Java 服务基地址配置
- Modify: `src/views/dictation/Dictation.vue` — 保持批量翻译调用不变，仅在需要时对错误输出做最小调整
- Modify: `src/views/dictation/composables/useSpeechPlayer.ts` — 保持单词懒加载调用不变，仅消费新的 `translateWord` 行为

### Backend repo: `D:/project/myself/blog-svc-springboot`
- Modify: `pom.xml` — 增加腾讯云 Java SDK 依赖
- Modify: `src/main/resources/application.yml` — 增加腾讯翻译配置、固定 token、允许来源配置
- Modify: `src/main/java/com/genesis/blog/webapp/filter/CrossDomainFilter.java` — 改为仅放行配置内来源，并允许 `X-Internal-Token`
- Create: `src/main/java/com/genesis/blog/webapp/config/TranslateConfig.java` — 读取腾讯翻译与接口保护配置
- Create: `src/main/java/com/genesis/blog/webapp/dtos/TranslateWordRequest.java` — 单词翻译请求 DTO
- Create: `src/main/java/com/genesis/blog/webapp/dtos/TranslateBatchRequest.java` — 批量翻译请求 DTO
- Create: `src/main/java/com/genesis/blog/webapp/dtos/TranslateItemResult.java` — 单词翻译结果 DTO
- Create: `src/main/java/com/genesis/blog/webapp/dtos/TranslateResponse.java` — 统一响应 DTO
- Create: `src/main/java/com/genesis/blog/webapp/service/TencentTranslateService.java` — 翻译服务接口
- Create: `src/main/java/com/genesis/blog/webapp/service/impl/TencentTranslateServiceImpl.java` — 腾讯云 TMT SDK 调用实现
- Create: `src/main/java/com/genesis/blog/webapp/controller/TranslateController.java` — `/translate/word` 与 `/translate/batch` 接口
- Create: `src/test/java/com/genesis/blog/webapp/service/impl/TencentTranslateServiceImplTest.java` — 服务层单元测试
- Create: `src/test/java/com/genesis/blog/webapp/controller/TranslateControllerTest.java` — 控制器鉴权与返回结构测试

---

### Task 1: 后端翻译服务与控制器

**Files:**
- Modify: `D:/project/myself/blog-svc-springboot/pom.xml`
- Modify: `D:/project/myself/blog-svc-springboot/src/main/resources/application.yml`
- Modify: `D:/project/myself/blog-svc-springboot/src/main/java/com/genesis/blog/webapp/filter/CrossDomainFilter.java`
- Create: `D:/project/myself/blog-svc-springboot/src/main/java/com/genesis/blog/webapp/config/TranslateConfig.java`
- Create: `D:/project/myself/blog-svc-springboot/src/main/java/com/genesis/blog/webapp/dtos/TranslateWordRequest.java`
- Create: `D:/project/myself/blog-svc-springboot/src/main/java/com/genesis/blog/webapp/dtos/TranslateBatchRequest.java`
- Create: `D:/project/myself/blog-svc-springboot/src/main/java/com/genesis/blog/webapp/dtos/TranslateItemResult.java`
- Create: `D:/project/myself/blog-svc-springboot/src/main/java/com/genesis/blog/webapp/dtos/TranslateResponse.java`
- Create: `D:/project/myself/blog-svc-springboot/src/main/java/com/genesis/blog/webapp/service/TencentTranslateService.java`
- Create: `D:/project/myself/blog-svc-springboot/src/main/java/com/genesis/blog/webapp/service/impl/TencentTranslateServiceImpl.java`
- Create: `D:/project/myself/blog-svc-springboot/src/main/java/com/genesis/blog/webapp/controller/TranslateController.java`
- Test: `D:/project/myself/blog-svc-springboot/src/test/java/com/genesis/blog/webapp/service/impl/TencentTranslateServiceImplTest.java`
- Test: `D:/project/myself/blog-svc-springboot/src/test/java/com/genesis/blog/webapp/controller/TranslateControllerTest.java`

- [ ] **Step 1: 写服务层失败测试，先固定英译中与批量逐项返回行为**

```java
package com.genesis.blog.webapp.service.impl;

import com.genesis.blog.webapp.config.TranslateConfig;
import com.genesis.blog.webapp.dtos.TranslateItemResult;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mockito;

import java.util.Arrays;
import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

public class TencentTranslateServiceImplTest {

    private TencentTranslateServiceImpl service;

    @Before
    public void setUp() {
        TranslateConfig config = new TranslateConfig();
        config.setSecretId("id");
        config.setSecretKey("key");
        config.setRegion("ap-guangzhou");
        config.setEndpoint("tmt.tencentcloudapi.com");
        service = Mockito.spy(new TencentTranslateServiceImpl(config));
    }

    @Test
    public void shouldTranslateSingleWordToChinese() throws Exception {
        Mockito.doReturn("苹果").when(service).doTranslate("apple");

        TranslateItemResult result = service.translateWord("apple");

        assertEquals("apple", result.getText());
        assertEquals("苹果", result.getTranslation());
        assertTrue(result.getSuccess());
        assertEquals("", result.getErrorMessage());
    }

    @Test
    public void shouldTranslateBatchAndKeepPerItemFailures() throws Exception {
        Mockito.doReturn("苹果").when(service).doTranslate("apple");
        Mockito.doThrow(new RuntimeException("quota")).when(service).doTranslate("banana");

        List<TranslateItemResult> results = service.translateBatch(Arrays.asList("apple", "banana"));

        assertEquals(2, results.size());
        assertEquals("苹果", results.get(0).getTranslation());
        assertTrue(results.get(0).getSuccess());
        assertEquals("banana", results.get(1).getText());
        assertEquals("", results.get(1).getTranslation());
        assertEquals(false, results.get(1).getSuccess());
        assertEquals("quota", results.get(1).getErrorMessage());
    }
}
```

- [ ] **Step 2: 写控制器失败测试，先固定 token 校验与响应结构**

```java
package com.genesis.blog.webapp.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.genesis.blog.webapp.dtos.TranslateBatchRequest;
import com.genesis.blog.webapp.dtos.TranslateItemResult;
import com.genesis.blog.webapp.service.TencentTranslateService;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@RunWith(SpringRunner.class)
@WebMvcTest(controllers = TranslateController.class)
@Import(com.genesis.blog.webapp.config.TranslateConfig.class)
public class TranslateControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TencentTranslateService tencentTranslateService;

    @Test
    public void shouldRejectRequestWithoutInternalToken() throws Exception {
        mockMvc.perform(post("/translate/word")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"text\":\"apple\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    public void shouldReturnBatchResultWithDataItems() throws Exception {
        TranslateBatchRequest request = new TranslateBatchRequest();
        request.setTexts(Collections.singletonList("apple"));

        Mockito.when(tencentTranslateService.translateBatch(Collections.singletonList("apple")))
                .thenReturn(Collections.singletonList(new TranslateItemResult("apple", "苹果", true, "")));

        mockMvc.perform(post("/translate/batch")
                .header("X-Internal-Token", "dictation-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].text").value("apple"))
                .andExpect(jsonPath("$.data[0].translation").value("苹果"));
    }
}
```

- [ ] **Step 3: 跑后端测试，确认当前实现尚不存在而失败**

Run:
```powershell
mvn -f "D:\project\myself\blog-svc-springboot\pom.xml" -Dtest=TencentTranslateServiceImplTest,TranslateControllerTest test
```

Expected: FAIL，报类不存在、Bean 不存在或接口未实现。

- [ ] **Step 4: 增加腾讯云 SDK 依赖与翻译配置**

`pom.xml` 新增依赖：

```xml
<dependency>
    <groupId>com.tencentcloudapi</groupId>
    <artifactId>tencentcloud-sdk-java</artifactId>
    <version>3.1.1000</version>
</dependency>

<dependency>
    <groupId>com.tencentcloudapi</groupId>
    <artifactId>tencentcloud-sdk-java-common</artifactId>
    <version>3.1.1000</version>
</dependency>
```

`application.yml` 追加配置：

```yml
translate:
  internal-token: dictation-token
  allowed-origins: gaopeng.fun,http://localhost:5173
  tencent:
    secret-id: ${TENCENT_TRANSLATE_SECRET_ID:}
    secret-key: ${TENCENT_TRANSLATE_SECRET_KEY:}
    region: ap-guangzhou
    endpoint: tmt.tencentcloudapi.com
```

`TranslateConfig.java`：

```java
package com.genesis.blog.webapp.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "translate.tencent")
public class TranslateConfig {

    private String secretId;
    private String secretKey;
    private String region;
    private String endpoint;

    public String getSecretId() { return secretId; }
    public void setSecretId(String secretId) { this.secretId = secretId; }
    public String getSecretKey() { return secretKey; }
    public void setSecretKey(String secretKey) { this.secretKey = secretKey; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }
}
```

- [ ] **Step 5: 实现请求/响应 DTO 与服务接口**

`TranslateWordRequest.java`：

```java
package com.genesis.blog.webapp.dtos;

public class TranslateWordRequest {
    private String text;

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}
```

`TranslateBatchRequest.java`：

```java
package com.genesis.blog.webapp.dtos;

import java.util.List;

public class TranslateBatchRequest {
    private List<String> texts;

    public List<String> getTexts() { return texts; }
    public void setTexts(List<String> texts) { this.texts = texts; }
}
```

`TranslateItemResult.java`：

```java
package com.genesis.blog.webapp.dtos;

public class TranslateItemResult {
    private String text;
    private String translation;
    private Boolean success;
    private String errorMessage;

    public TranslateItemResult() {
    }

    public TranslateItemResult(String text, String translation, Boolean success, String errorMessage) {
        this.text = text;
        this.translation = translation;
        this.success = success;
        this.errorMessage = errorMessage;
    }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getTranslation() { return translation; }
    public void setTranslation(String translation) { this.translation = translation; }
    public Boolean getSuccess() { return success; }
    public void setSuccess(Boolean success) { this.success = success; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}
```

`TranslateResponse.java`：

```java
package com.genesis.blog.webapp.dtos;

public class TranslateResponse<T> {
    private Boolean success;
    private T data;
    private String message;

    public TranslateResponse() {
    }

    public TranslateResponse(Boolean success, T data, String message) {
        this.success = success;
        this.data = data;
        this.message = message;
    }

    public static <T> TranslateResponse<T> ok(T data) {
        return new TranslateResponse<>(true, data, "");
    }

    public static <T> TranslateResponse<T> fail(String message, T data) {
        return new TranslateResponse<>(false, data, message);
    }

    public Boolean getSuccess() { return success; }
    public void setSuccess(Boolean success) { this.success = success; }
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
```

`TencentTranslateService.java`：

```java
package com.genesis.blog.webapp.service;

import com.genesis.blog.webapp.dtos.TranslateItemResult;

import java.util.List;

public interface TencentTranslateService {
    TranslateItemResult translateWord(String text);
    List<TranslateItemResult> translateBatch(List<String> texts);
}
```

- [ ] **Step 6: 实现腾讯翻译服务，固定为英译中**

`TencentTranslateServiceImpl.java`：

```java
package com.genesis.blog.webapp.service.impl;

import com.genesis.blog.webapp.config.TranslateConfig;
import com.genesis.blog.webapp.dtos.TranslateItemResult;
import com.genesis.blog.webapp.service.TencentTranslateService;
import com.tencentcloudapi.common.Credential;
import com.tencentcloudapi.common.exception.TencentCloudSDKException;
import com.tencentcloudapi.common.profile.ClientProfile;
import com.tencentcloudapi.common.profile.HttpProfile;
import com.tencentcloudapi.tmt.v20180321.TmtClient;
import com.tencentcloudapi.tmt.v20180321.models.TextTranslateRequest;
import com.tencentcloudapi.tmt.v20180321.models.TextTranslateResponse;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class TencentTranslateServiceImpl implements TencentTranslateService {

    private final TranslateConfig translateConfig;

    public TencentTranslateServiceImpl(TranslateConfig translateConfig) {
        this.translateConfig = translateConfig;
    }

    @Override
    public TranslateItemResult translateWord(String text) {
        if (StringUtils.isBlank(text)) {
            return new TranslateItemResult("", "", false, "text is blank");
        }
        try {
            String translation = doTranslate(text.trim());
            return new TranslateItemResult(text.trim(), translation, true, "");
        } catch (Exception e) {
            return new TranslateItemResult(text.trim(), "", false, e.getMessage());
        }
    }

    @Override
    public List<TranslateItemResult> translateBatch(List<String> texts) {
        List<TranslateItemResult> results = new ArrayList<>();
        if (texts == null) {
            return results;
        }
        for (String text : texts) {
            results.add(translateWord(text));
        }
        return results;
    }

    protected String doTranslate(String text) throws TencentCloudSDKException {
        Credential credential = new Credential(translateConfig.getSecretId(), translateConfig.getSecretKey());

        HttpProfile httpProfile = new HttpProfile();
        httpProfile.setEndpoint(translateConfig.getEndpoint());

        ClientProfile clientProfile = new ClientProfile();
        clientProfile.setHttpProfile(httpProfile);

        TmtClient client = new TmtClient(credential, translateConfig.getRegion(), clientProfile);

        TextTranslateRequest request = new TextTranslateRequest();
        request.setSourceText(text);
        request.setSource("en");
        request.setTarget("zh");
        request.setProjectId(0L);

        TextTranslateResponse response = client.TextTranslate(request);
        return response.getTargetText();
    }
}
```

- [ ] **Step 7: 实现控制器与跨域来源限制**

`TranslateController.java`：

```java
package com.genesis.blog.webapp.controller;

import com.genesis.blog.webapp.dtos.TranslateBatchRequest;
import com.genesis.blog.webapp.dtos.TranslateResponse;
import com.genesis.blog.webapp.dtos.TranslateWordRequest;
import com.genesis.blog.webapp.service.TencentTranslateService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;

@RestController
@RequestMapping("/translate")
public class TranslateController {

    private final TencentTranslateService tencentTranslateService;

    @Value("${translate.internal-token}")
    private String internalToken;

    public TranslateController(TencentTranslateService tencentTranslateService) {
        this.tencentTranslateService = tencentTranslateService;
    }

    @PostMapping("/word")
    public ResponseEntity<TranslateResponse<?>> translateWord(
            @RequestHeader(value = "X-Internal-Token", required = false) String token,
            @RequestBody TranslateWordRequest request) {
        if (!StringUtils.equals(token, internalToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(TranslateResponse.fail("unauthorized", null));
        }
        return ResponseEntity.ok(TranslateResponse.ok(tencentTranslateService.translateWord(request.getText())));
    }

    @PostMapping("/batch")
    public ResponseEntity<TranslateResponse<?>> translateBatch(
            @RequestHeader(value = "X-Internal-Token", required = false) String token,
            @RequestBody TranslateBatchRequest request) {
        if (!StringUtils.equals(token, internalToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(TranslateResponse.fail("unauthorized", Collections.emptyList()));
        }
        return ResponseEntity.ok(TranslateResponse.ok(tencentTranslateService.translateBatch(request.getTexts())));
    }
}
```

`CrossDomainFilter.java` 改为：

```java
package com.genesis.blog.webapp.filter;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class CrossDomainFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(CrossDomainFilter.class);

    @Value("${translate.allowed-origins:}")
    private String allowedOrigins;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletResponse httpServletResponse = (HttpServletResponse) response;
        HttpServletRequest httpServletRequest = (HttpServletRequest) request;

        String origin = httpServletRequest.getHeader("Origin");
        if (allowedToCros(origin)) {
            httpServletResponse.setHeader("Access-Control-Allow-Origin", origin);
            httpServletResponse.setHeader("Access-Control-Max-Age", "1800");
            httpServletResponse.setHeader("Access-Control-Allow-Headers", "Content-Type, Content-Length, Authorization, Accept, X-Requested-With, Token, X-Internal-Token");
            httpServletResponse.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
            httpServletResponse.setHeader("Access-Control-Allow-Credentials", "true");
        }

        if (HttpMethod.OPTIONS.toString().equals(httpServletRequest.getMethod())) {
            httpServletResponse.setStatus(HttpStatus.OK.value());
            return;
        }

        chain.doFilter(request, response);
    }

    private Boolean allowedToCros(String origin) {
        if (StringUtils.isBlank(origin) || StringUtils.isBlank(allowedOrigins)) {
            return false;
        }
        List<String> originList = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(StringUtils::isNotBlank)
                .collect(Collectors.toList());
        return originList.contains(origin);
    }
}
```

- [ ] **Step 8: 跑后端测试，确认实现通过**

Run:
```powershell
mvn -f "D:\project\myself\blog-svc-springboot\pom.xml" -Dtest=TencentTranslateServiceImplTest,TranslateControllerTest test
```

Expected: PASS，测试输出 2 个测试类均通过。

- [ ] **Step 9: 手动启动后端并用本地请求验证接口**

Run:
```powershell
mvn -f "D:\project\myself\blog-svc-springboot\pom.xml" spring-boot:run
```

Then run:
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:9898/api-blog/translate/word" -Headers @{"X-Internal-Token"="dictation-token"} -ContentType "application/json" -Body '{"text":"apple"}'
```

Expected:
```json
{
  "success": true,
  "data": {
    "text": "apple",
    "translation": "苹果",
    "success": true,
    "errorMessage": ""
  },
  "message": ""
}
```

- [ ] **Step 10: 提交后端改动**

```bash
git add pom.xml src/main/resources/application.yml src/main/java/com/genesis/blog/webapp/filter/CrossDomainFilter.java src/main/java/com/genesis/blog/webapp/config/TranslateConfig.java src/main/java/com/genesis/blog/webapp/dtos/TranslateWordRequest.java src/main/java/com/genesis/blog/webapp/dtos/TranslateBatchRequest.java src/main/java/com/genesis/blog/webapp/dtos/TranslateItemResult.java src/main/java/com/genesis/blog/webapp/dtos/TranslateResponse.java src/main/java/com/genesis/blog/webapp/service/TencentTranslateService.java src/main/java/com/genesis/blog/webapp/service/impl/TencentTranslateServiceImpl.java src/main/java/com/genesis/blog/webapp/controller/TranslateController.java src/test/java/com/genesis/blog/webapp/service/impl/TencentTranslateServiceImplTest.java src/test/java/com/genesis/blog/webapp/controller/TranslateControllerTest.java
git commit -m "$(cat <<'EOF'
feat(translate): 新增腾讯翻译后端中转接口

新增英译中单词与批量翻译接口，接入腾讯云机器翻译并增加固定 token 校验。
EOF
)"
```

### Task 2: 前端改为请求 Java 后端翻译接口

**Files:**
- Modify: `D:/project/myself/edu-tools/src/utils/translate.ts`
- Modify: `D:/project/myself/edu-tools/vite.config.ts`
- Modify: `D:/project/myself/edu-tools/.env.local`
- Modify: `D:/project/myself/edu-tools/src/views/dictation/Dictation.vue`
- Modify: `D:/project/myself/edu-tools/src/views/dictation/composables/useSpeechPlayer.ts`

- [ ] **Step 1: 先写前端翻译门面的失败预期，固定返回结构映射**

在 `src/utils/translate.ts` 旁边临时写出目标实现草稿，确保以下两个函数签名不变：

```ts
export async function translateWord(word: string): Promise<string>
export async function batchTranslate(words: string[]): Promise<string[]>
```

目标行为草稿：

```ts
async function requestTranslate<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${import.meta.env.VITE_BLOG_API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': import.meta.env.VITE_TRANSLATE_INTERNAL_TOKEN,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`translate request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
```

- [ ] **Step 2: 运行前端类型检查，确认当前实现尚未满足新接口结构**

Run:
```powershell
pnpm --dir "D:\project\myself\edu-tools" type-check
```

Expected: PASS 或与翻译无关；此步仅确认当前项目基线正常，下一步将改实现。

- [ ] **Step 3: 用最小改动实现新的后端请求门面**

`src/utils/translate.ts` 替换为：

```ts
interface TranslateItemResult {
  text: string;
  translation: string;
  success: boolean;
  errorMessage: string;
}

interface TranslateResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

const apiBaseUrl = import.meta.env.VITE_BLOG_API_BASE_URL;
const internalToken = import.meta.env.VITE_TRANSLATE_INTERNAL_TOKEN;

async function requestTranslate<T>(path: string, body: unknown): Promise<T> {
  if (!apiBaseUrl || !internalToken) {
    throw new Error('translate api config missing');
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': internalToken
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`translate request failed: ${response.status}`);
  }

  const result = await response.json() as TranslateResponse<T>;
  if (!result.success) {
    throw new Error(result.message || 'translate request failed');
  }
  return result.data;
}

export async function translateWord(word: string): Promise<string> {
  if (!word.trim()) {
    return '';
  }

  try {
    const result = await requestTranslate<TranslateItemResult>('/translate/word', { text: word });
    return result.success ? result.translation : '';
  } catch {
    return '';
  }
}

export async function batchTranslate(words: string[]): Promise<string[]> {
  if (words.length === 0) {
    return [];
  }

  try {
    const results = await requestTranslate<TranslateItemResult[]>('/translate/batch', { texts: words });
    return results.map(item => item.success ? item.translation : '');
  } catch {
    return words.map(() => '');
  }
}
```

`.env.local` 改为：

```dotenv
VITE_BLOG_API_BASE_URL=http://localhost:9898/api-blog
VITE_TRANSLATE_INTERNAL_TOKEN=dictation-token
```

`vite.config.ts` 删除：

```ts
server: {
  proxy: {
    '/api/translate': {
      target: 'https://openapi.youdao.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/translate/, '/api')
    }
  }
},
```

- [ ] **Step 4: 保持现有页面调用点不变，只清理与有道实现强耦合的部分**

`src/views/dictation/Dictation.vue` 保持：

```ts
const translations = await batchTranslate(wordList);
previewWords.value = wordList.map((text, index) => ({ text, translation: translations[index] || '', index }));
```

`src/views/dictation/composables/useSpeechPlayer.ts` 保持：

```ts
const translation = await translateWord(word.text);
store.updateWordTranslation(index, translation);
```

只在确有报错时做最小修正，不新增额外状态或抽象。

- [ ] **Step 5: 运行前端校验**

Run:
```powershell
pnpm --dir "D:\project\myself\edu-tools" type-check
pnpm --dir "D:\project\myself\edu-tools" lint
pnpm --dir "D:\project\myself\edu-tools" build
```

Expected:
- `type-check` PASS
- `lint` PASS
- `build` PASS

- [ ] **Step 6: 联调并手动验证单词听写翻译流程**

Run backend:
```powershell
mvn -f "D:\project\myself\blog-svc-springboot\pom.xml" spring-boot:run
```

Run frontend:
```powershell
pnpm --dir "D:\project\myself\edu-tools" dev
```

Manual test checklist:
- 打开 `http://localhost:5173/#/dictation`
- 输入 `apple banana orange`
- 点击“加载单词”
- 确认预览弹窗中每个单词都能显示中文译文
- 进入播放页
- 确认当前单词区域能显示译文
- 手动删除某个词后再次加载，确认剩余词条索引与翻译展示正常
- 在后端 token 填错时重试一次，确认前端不崩溃，译文为空字符串

- [ ] **Step 7: 提交前端改动**

```bash
git add src/utils/translate.ts vite.config.ts .env.local src/views/dictation/Dictation.vue src/views/dictation/composables/useSpeechPlayer.ts
git commit -m "$(cat <<'EOF'
refactor(dictation): 改为调用后端腾讯翻译接口

移除有道前端签名与代理配置，统一通过后端中转获取英译中结果。
EOF
)"
```

### Task 3: 收尾验证与配置说明

**Files:**
- Modify: `D:/project/myself/edu-tools/docs/superpowers/plans/2026-05-05-tencent-translation-relay.md`
- Modify: `D:/project/myself/blog-svc-springboot/src/main/resources/application.yml`
- Modify: `D:/project/myself/edu-tools/.env.local`

- [ ] **Step 1: 核对密钥与 token 配置项最终名称一致**

最终配置名必须保持如下：

```yml
translate:
  internal-token: dictation-token
  allowed-origins: gaopeng.fun,http://localhost:5173
  tencent:
    secret-id: ${TENCENT_TRANSLATE_SECRET_ID:}
    secret-key: ${TENCENT_TRANSLATE_SECRET_KEY:}
    region: ap-guangzhou
    endpoint: tmt.tencentcloudapi.com
```

```dotenv
VITE_BLOG_API_BASE_URL=http://localhost:9898/api-blog
VITE_TRANSLATE_INTERNAL_TOKEN=dictation-token
```

- [ ] **Step 2: 运行最终验证命令**

Run:
```powershell
mvn -f "D:\project\myself\blog-svc-springboot\pom.xml" -Dtest=TencentTranslateServiceImplTest,TranslateControllerTest test
pnpm --dir "D:\project\myself\edu-tools" type-check
pnpm --dir "D:\project\myself\edu-tools" lint
pnpm --dir "D:\project\myself\edu-tools" build
```

Expected:
- Maven tests PASS
- `pnpm type-check` PASS
- `pnpm lint` PASS
- `pnpm build` PASS

- [ ] **Step 3: 做一次最终手工回归**

Manual regression checklist:
- 听写首页输入英文单词可正常弹出预览
- 预览弹窗的编辑、删除、确认仍可用
- 播放页的上一条、下一条、暂停、继续、停止仍可用
- 某个词翻译失败时只影响该词，不影响整批展示或播放
- 浏览器网络面板中不再出现对有道接口或 `/api/translate` 的请求

- [ ] **Step 4: 提交最终收尾改动**

```bash
git add src/main/resources/application.yml .env.local docs/superpowers/plans/2026-05-05-tencent-translation-relay.md
git commit -m "$(cat <<'EOF'
chore(translate): 补齐腾讯翻译联调配置

统一整理中转服务配置项并完成联调验证。
EOF
)"
```

## Self-review

- Spec coverage: 已覆盖后端腾讯云 SDK 接入、单条与批量接口、固定 token、防跨域来源、前端替换有道实现、联调与手工验证。
- Placeholder scan: 已去掉 TBD/TODO/“自行实现”类占位描述，代码步骤给出具体内容。
- Type consistency: 统一使用 `TranslateItemResult`、`TranslateResponse`、`TencentTranslateService`、`translateWord`、`batchTranslate` 命名，没有在任务间切换名称。
