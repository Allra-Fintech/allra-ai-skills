---
name: allra-test-writing
description: Allra 백엔드 테스트 작성 표준. Use when writing test code, choosing test helpers, generating test data with Fixture Monkey, or verifying test coverage.
---

# Allra Test Writing Standards

Allra 백엔드 팀의 테스트 작성 표준을 정의합니다. 테스트 헬퍼 선택, Fixture Monkey 데이터 생성, Given-When-Then 패턴, AssertJ 검증을 포함합니다.

## 프로젝트 기본 정보

이 가이드는 다음 환경을 기준으로 작성되었습니다:

- **Java**: 17 이상
- **Spring Boot**: 3.2 이상
- **Testing Framework**: JUnit 5
- **Assertion Library**: AssertJ
- **Mocking**: Mockito
- **Test Data**: Fixture Monkey (선택 사항)
- **Container**: Testcontainers (선택 사항)

**참고**: 프로젝트별로 사용하는 라이브러리나 버전이 다를 수 있습니다. 프로젝트에 맞게 조정하여 사용하세요.

## 테스트 헬퍼 선택 가이드

**주의**: 아래 테스트 헬퍼는 Allra 표준 템플릿에서 제공됩니다. 프로젝트에 이러한 헬퍼가 없는 경우, Spring Boot 기본 테스트 어노테이션(`@SpringBootTest`, `@DataJpaTest`, `@WebMvcTest` 등)을 직접 사용하되, 이 가이드의 테스트 패턴과 원칙은 동일하게 적용합니다.

| 헬퍼 | 태그 | 용도 | 무게 | 언제? |
|------|------|------|------|-------|
| **IntegrationTest** | Integration | 여러 서비스 통합 | 🔴 무거움 | 전체 워크플로우 |
| **RdbTest** | RDB | Repository, QueryDSL | 🟡 중간 | 쿼리 검증 |
| **ControllerTest** | Controller | API 엔드포인트 | 🟢 가벼움 | REST API 검증 |
| **RedisTest** | Redis | Redis 캐싱 | 🟢 가벼움 | 캐시 검증 |
| **MockingUnitTest** | MockingUnit | Service 단위 | 🟢 매우 가벼움 | 비즈니스 로직 |
| **PojoUnitTest** | PojoUnit | 도메인 로직 | 🟢 매우 가벼움 | 순수 자바 |

### 선택 플로우

```
API 엔드포인트? → ControllerTest
여러 서비스 통합? → IntegrationTest
Repository/QueryDSL? → RdbTest
Redis 캐싱? → RedisTest
Service 로직 (Mock)? → MockingUnitTest
도메인 로직 (POJO)? → PojoUnitTest
```

---

## 테스트 헬퍼 구조

### IntegrationTest - 통합 테스트

```java
@Tag("Integration")
@SpringBootTest
public abstract class IntegrationTest {
    // 전체 Spring Context, Testcontainers 활용
}
```

**언제**: 여러 서비스 협력, 실제 DB/외부 시스템 필요
**주의**: 가장 무거움, 외부 API는 `@MockBean` 사용

### RdbTest - Repository 테스트

```java
@Tag("RDB")
@DataJpaTest
public abstract class RdbTest {}
```

**언제**: Repository CRUD, QueryDSL 쿼리, N+1 문제 검증

### ControllerTest - API 테스트

```java
@Tag("Controller")
@WebMvcTest(TargetController.class)
public abstract class ControllerTest {
    @Autowired
    protected MockMvc mockMvc;
}
```

**언제**: API 엔드포인트, HTTP Status, 입력 검증
**주의**: Service는 `@MockBean` 필수

### RedisTest - Redis 테스트

```java
@Tag("Redis")
@DataRedisTest
public abstract class RedisTest {}
```

**언제**: Redis 캐싱, 세션 저장소 검증

### MockingUnitTest - Service 단위 테스트

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;
}
```

**언제**: Service 로직 단위 테스트, 빠른 테스트
**주의**: Spring Context 없음, `@Autowired` 불가

### PojoUnitTest - 도메인 로직 테스트

```java
class UserTest {
    @Test
    void activate_Success() {
        // 순수 자바 로직 테스트
    }
}
```

**언제**: 도메인 엔티티, VO, 유틸리티 클래스

---

## Fixture Monkey - 테스트 데이터 생성

### 의존성 설정

```gradle
// Gradle
testImplementation 'com.navercorp.fixturemonkey:fixture-monkey-starter:1.0.13'
```

```xml
<!-- Maven -->
<dependency>
    <groupId>com.navercorp.fixturemonkey</groupId>
    <artifactId>fixture-monkey-starter</artifactId>
    <version>1.0.13</version>
    <scope>test</scope>
</dependency>
```

### 사용법

```java
import static {your.package}.fixture.FixtureFactory.FIXTURE_MONKEY;

// 단순 생성
User user = FIXTURE_MONKEY.giveMeOne(User.class);

// 특정 필드 지정
User user = FIXTURE_MONKEY.giveMeBuilder(User.class)
    .set("email", "test@example.com")
    .set("active", true)
    .sample();

// 여러 개 생성
List<User> users = FIXTURE_MONKEY.giveMe(User.class, 10);
```

---

## Given-When-Then 패턴 (필수)

**모든 테스트는 Given-When-Then 패턴 필수**

```java
@Test
@DisplayName("사용자 생성 - 성공")
void createUser_Success() {
    // given - 테스트 준비
    UserRequest request = new UserRequest("test@example.com", "password");
    User savedUser = FIXTURE_MONKEY.giveMeOne(User.class);
    when(userRepository.save(any())).thenReturn(savedUser);

    // when - 실제 실행
    UserResponse response = userService.createUser(request);

    // then - 검증
    assertThat(response).isNotNull();
    verify(userRepository, times(1)).save(any());
}
```

---

## AssertJ 검증 패턴

```java
// 단일 값
assertThat(response).isNotNull();
assertThat(response.userId()).isEqualTo(1L);

// 컬렉션
assertThat(users).hasSize(3);
assertThat(users).extracting(User::getEmail)
    .containsExactlyInAnyOrder("a@test.com", "b@test.com");

// Boolean
assertThat(user.isActive()).isTrue();

// 예외
assertThatThrownBy(() -> userService.findById(999L))
    .isInstanceOf(BusinessException.class)
    .hasMessageContaining("USER_NOT_FOUND");

// Optional
assertThat(result).isPresent();
assertThat(result.get().getName()).isEqualTo("홍길동");
```

---

## Mockito 패턴

### Mock 설정

```java
// 반환값
when(userRepository.findById(1L)).thenReturn(Optional.of(user));

// void 메서드
doNothing().when(emailService).sendEmail(any());

// 예외 발생
when(userRepository.findById(999L))
    .thenThrow(new BusinessException(ErrorCode.USER_NOT_FOUND));
```

### Mock 호출 검증

```java
// 호출 횟수
verify(userRepository, times(1)).findById(1L);
verify(userRepository, never()).delete(any());

// 인자 검증
verify(userRepository).save(argThat(user ->
    user.getEmail().equals("test@example.com")
));
```

---

## 테스트 명명 규칙

### 클래스

```java
class ApplyServiceIntegrationTest extends IntegrationTest  // Integration
class UserRepositoryTest extends RdbTest                   // Repository
class UserControllerTest extends ControllerTest            // Controller
class UserServiceTest                                      // Service Unit
class UserTest                                             // Domain
```

### 메서드

```java
// 패턴: {메서드명}_{시나리오}_{예상결과}
@Test
@DisplayName("사용자 생성 - 성공")
void createUser_ValidRequest_Success()

@Test
@DisplayName("사용자 조회 - 사용자 없음")
void findById_UserNotFound_ThrowsException()
```

---

## 테스트 예시

### Controller 테스트

```java
@DisplayName("User -> UserController 테스트")
@WebMvcTest(UserController.class)
class UserControllerTest extends ControllerTest {

    @MockBean
    private UserService userService;

    @Test
    @DisplayName("사용자 조회 API - 성공")
    void getUser_Success() throws Exception {
        // given
        Long userId = 1L;
        UserResponse response = new UserResponse(userId, "test@example.com");
        when(userService.findById(userId)).thenReturn(response);

        // when & then
        mockMvc.perform(get("/api/v1/users/{id}", userId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.userId").value(userId));
    }
}
```

### Service 단위 테스트

```java
@ExtendWith(MockitoExtension.class)
@DisplayName("User -> UserService 단위 테스트")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    @DisplayName("사용자 조회 - 성공")
    void findById_Success() {
        // given
        Long userId = 1L;
        User user = FIXTURE_MONKEY.giveMeBuilder(User.class)
            .set("id", userId)
            .sample();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        // when
        UserResponse response = userService.findById(userId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.userId()).isEqualTo(userId);
        verify(userRepository, times(1)).findById(userId);
    }
}
```

### Repository 테스트

```java
@DisplayName("User -> UserRepository 테스트")
class UserRepositoryTest extends RdbTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("활성 사용자 조회 - 성공")
    void findActiveUsers_Success() {
        // given
        User active = FIXTURE_MONKEY.giveMeBuilder(User.class)
            .set("active", true)
            .sample();
        userRepository.save(active);

        // when
        List<UserDto> result = userRepository.findActiveUsers();

        // then
        assertThat(result).hasSize(1);
        assertThat(result).extracting(UserDto::email)
            .contains(active.getEmail());
    }
}
```

---

## When to Use This Skill

이 skill은 다음 상황에서 자동으로 적용됩니다:

- 테스트 파일 생성 또는 수정
- 테스트 헬퍼 선택 (IntegrationTest, RdbTest, ControllerTest 등)
- 테스트 데이터 생성 (Fixture Monkey 사용)
- Given-When-Then 패턴 적용
- AssertJ 검증 코드 작성
- Mockito Mock 설정 및 검증

---

## Checklist

테스트 코드 작성 시 확인사항:

**모든 테스트 공통**
- [ ] Given-When-Then 패턴을 따르는가?
- [ ] @DisplayName으로 테스트 의도가 명확한가?
- [ ] AssertJ로 검증하는가?
- [ ] 메서드명이 `메서드_시나리오_결과` 패턴인가?

**IntegrationTest**
- [ ] 여러 서비스 협력이 필요한 경우만 사용하는가?
- [ ] 외부 API는 @MockBean으로 처리했는가?

**RdbTest**
- [ ] Repository/QueryDSL 테스트만 포함하는가?
- [ ] N+1 문제를 검증했는가?

**ControllerTest**
- [ ] @WebMvcTest(TargetController.class)를 명시했는가?
- [ ] Service는 @MockBean으로 처리했는가?
- [ ] HTTP Status Code를 검증하는가?

**MockingUnitTest**
- [ ] @Mock으로 의존성, @InjectMocks로 테스트 대상을 주입했는가?
- [ ] verify()로 Mock 호출을 검증했는가?

**PojoUnitTest**
- [ ] 도메인 로직만 테스트하는가?
- [ ] 외부 의존성이 없는가?

---

## 테스트 실행 명령어

### Gradle

```bash
./gradlew test                                    # 전체 테스트
./gradlew test --tests * -Dtest.tags=Integration # 태그별 실행
./gradlew test --tests UserServiceTest            # 특정 클래스
```

### Maven

```bash
./mvnw test                        # 전체 테스트
./mvnw test -Dgroups=Integration   # 태그별 실행
./mvnw test -Dtest=UserServiceTest # 특정 클래스
```

---

## 테스트 품질 기준

1. **커버리지**: 핵심 비즈니스 로직 70% 이상
2. **격리성**: 각 테스트가 독립적으로 실행 가능
3. **속도**: 단위 테스트 1초 이내, 통합 테스트 5초 이내
4. **명확성**: 테스트 이름만으로 의도 파악 가능
5. **신뢰성**: 같은 입력에 항상 같은 결과
