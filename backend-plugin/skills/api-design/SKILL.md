---
name: allra-api-design
description: Allra 백엔드 API 설계 및 패키지 구조 규칙. Use when creating REST APIs, DTOs, or organizing backend code structure.
---

# Allra Backend API 설계 및 패키지 구조

Allra 백엔드 팀의 API 설계, DTO 네이밍, 패키지 구조 표준을 정의합니다.

## 프로젝트 기본 정보

- **패키지**: kr.co.allra.*
- **Java 버전**: 17
- **Spring Boot 버전**: 3.2.4
- **주요 기술**: JPA/Hibernate, QueryDSL 5.0.0, JWT

## 패키지 구조 규칙

반드시 도메인별 패키지 구조를 따릅니다:

```text
└── {domain}
    ├── api          // 컨트롤러 레이어
    ├── dto          // 데이터 전송 객체
    ├── entity       // JPA 엔티티
    ├── enums        // Enum 정의
    ├── repository   // 데이터 접근 계층
    └── service      // 비즈니스 로직
```

### 예시

```text
└── user
    ├── api
    │   └── UserController.java
    ├── dto
    │   ├── UserSignUpEventDto.java  // 내부 사용
    │   ├── request
    │   │   └── SignUpRequest.java
    │   └── response
    │       └── SignUpResponse.java
    ├── entity
    │   └── User.java
    ├── repository
    │   ├── UserRepository.java
    │   └── UserRepositorySupport.java
    └── service
        └── UserService.java
```

## DTO 네이밍 규칙

### 1. 클라이언트 통신 DTO

- **Request**: `{Operation}Request`
  - 예: `SignUpRequest`, `UpdateUserRequest`
- **Response**: `{Operation}Response`
  - 예: `SignUpResponse`, `UserDetailResponse`

### 2. 내부 사용 DTO

내부에서만 사용하는 DTO는 `Dto` 접미사 추가:
- Repository Layer QueryDSL Fetch DTO
- Internal Layer Transfer DTO
- 예: `UserSignUpEventDto`, `UserSummaryDto`

### 3. Record 사용

**DTO 같은 단순 클래스들은 가능하면 대부분 record로 생성**

```java
// Request/Response
public record SignUpRequest(
    String email,
    String password,
    String name
) {}

public record SignUpResponse(
    Long userId,
    String email
) {}

// 내부 사용 DTO
public record UserSignUpEventDto(
    Long userId,
    String email,
    LocalDateTime signUpAt
) {}
```

## API 컨트롤러 설계 가이드

### 1. REST API 명명 규칙

```java
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    // GET /api/v1/users - 목록 조회
    @GetMapping
    public List<UserResponse> getUsers() { }

    // GET /api/v1/users/{id} - 단건 조회
    @GetMapping("/{id}")
    public UserDetailResponse getUser(@PathVariable Long id) { }

    // POST /api/v1/users - 생성
    @PostMapping
    public SignUpResponse createUser(@RequestBody @Valid SignUpRequest request) { }

    // PUT /api/v1/users/{id} - 전체 수정
    @PutMapping("/{id}")
    public UserResponse updateUser(
        @PathVariable Long id,
        @RequestBody @Valid UpdateUserRequest request
    ) { }

    // PATCH /api/v1/users/{id} - 부분 수정
    @PatchMapping("/{id}")
    public UserResponse patchUser(
        @PathVariable Long id,
        @RequestBody @Valid PatchUserRequest request
    ) { }

    // DELETE /api/v1/users/{id} - 삭제
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) { }
}
```

### 2. Request Validation

모든 Request DTO는 Bean Validation 사용:

```java
public record SignUpRequest(
    @NotBlank(message = "이메일은 필수입니다")
    @Email(message = "올바른 이메일 형식이 아닙니다")
    String email,

    @NotBlank(message = "비밀번호는 필수입니다")
    @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다")
    String password,

    @NotBlank(message = "이름은 필수입니다")
    String name
) {}
```

### 3. 응답 형식 표준화

성공 응답:
```java
{
  "data": { ... },
  "message": "요청이 성공적으로 처리되었습니다"
}
```

에러 응답:
```java
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "사용자를 찾을 수 없습니다",
    "details": []
  }
}
```

## When to Use This Skill

이 skill은 다음 상황에서 자동으로 적용됩니다:

- 새로운 API 엔드포인트 생성
- DTO 클래스 작성
- 컨트롤러 구현
- 도메인 패키지 구조 설계
- Request/Response 객체 네이밍

## Examples

### 예제 1: 새로운 도메인 API 생성

```java
// 1. 패키지 구조 생성
kr.co.allra.product/
├── api/ProductController.java
├── dto/
│   ├── request/CreateProductRequest.java
│   └── response/ProductResponse.java
├── entity/Product.java
├── repository/ProductRepository.java
└── service/ProductService.java

// 2. Request DTO
public record CreateProductRequest(
    @NotBlank String name,
    @NotNull BigDecimal price
) {}

// 3. Response DTO
public record ProductResponse(
    Long id,
    String name,
    BigDecimal price,
    LocalDateTime createdAt
) {}

// 4. Controller
@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    @PostMapping
    public ProductResponse createProduct(
        @RequestBody @Valid CreateProductRequest request
    ) {
        return productService.createProduct(request);
    }
}
```

### 예제 2: 내부 DTO 생성

```java
// QueryDSL 결과를 위한 내부 DTO
public record ProductSummaryDto(
    Long id,
    String name,
    Long orderCount
) {
    @QueryProjection
    public ProductSummaryDto {}
}

// 이벤트 전달용 내부 DTO
public record ProductCreatedEventDto(
    Long productId,
    String productName,
    LocalDateTime createdAt
) {}
```

## Checklist

새로운 API를 만들 때 확인사항:

- [ ] 도메인별 패키지 구조를 따르는가?
- [ ] Request/Response DTO 네이밍이 규칙을 따르는가?
- [ ] DTO가 record로 작성되었는가?
- [ ] Request DTO에 Validation이 적용되었는가?
- [ ] REST API 명명 규칙을 따르는가?
- [ ] API 버저닝이 적용되었는가? (/api/v1/...)
- [ ] 내부 사용 DTO에 `Dto` 접미사가 있는가?
