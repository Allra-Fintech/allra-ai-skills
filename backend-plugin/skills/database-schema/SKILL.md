---
name: allra-database-schema
description: Allra 데이터베이스 설계 및 QueryDSL 사용 규칙. Use when creating JPA entities, writing QueryDSL queries, or adding @Transactional annotations.
---

# Allra Database 설계 및 QueryDSL 규칙

Allra 백엔드 팀의 데이터베이스 설계, JPA, QueryDSL, 트랜잭션 관리 표준을 정의합니다.

## 기술 스택

- **Database**: MariaDB, MongoDB, Redis
- **ORM**: JPA/Hibernate, QueryDSL 5.0.0
- **Testing**: Testcontainers, Fixture Monkey

## QueryDSL 사용 규칙

### 1. Repository 구조

**반드시** JPA Repository와 Support를 함께 사용:

```java
// JPA Repository 인터페이스
public interface UserRepository extends JpaRepository<User, Long>, UserRepositorySupport {
}

// QueryDSL Support 인터페이스
public interface UserRepositorySupport {
    List<UserSummaryDto> findUserSummaries(UserSearchCondition condition);
    Optional<User> findByEmailWithRoles(String email);
}

// QueryDSL Support 구현체
@Repository
public class UserRepositoryImpl implements UserRepositorySupport {

    private final JPAQueryFactory queryFactory;

    public UserRepositoryImpl(JPAQueryFactory queryFactory) {
        this.queryFactory = queryFactory;
    }

    @Override
    public List<UserSummaryDto> findUserSummaries(UserSearchCondition condition) {
        return queryFactory
            .select(new QUserSummaryDto(
                user.id,
                user.email,
                user.name
            ))
            .from(user)
            .where(
                emailContains(condition.email()),
                nameContains(condition.name())
            )
            .fetch();
    }

    private BooleanExpression emailContains(String email) {
        return email != null ? user.email.contains(email) : null;
    }

    private BooleanExpression nameContains(String name) {
        return name != null ? user.name.contains(name) : null;
    }
}
```

### 2. QueryDSL DTO Projection

**반드시** record와 `@QueryProjection` 사용:

```java
// DTO 정의
public record UserSummaryDto(
    Long id,
    String email,
    String name
) {
    @QueryProjection
    public UserSummaryDto {}
}
```

**빌드 설정** (`build.gradle`):
```gradle
annotationProcessor "com.querydsl:querydsl-apt:${queryDslVersion}:jakarta"
```

빌드 시 `build/generated/sources/annotationProcessor` 경로에 `QUserSummaryDto` 자동 생성됨.

### 3. From 절에 맞는 Repository 위치

**가능한** From절에 해당하는 Repository에 정의:

```java
// ❌ 잘못된 예: Order에서 User를 조회
public interface OrderRepository extends JpaRepository<Order, Long>, OrderRepositorySupport {
}

public interface OrderRepositorySupport {
    // From user이지만 OrderRepository에 정의됨 (잘못됨)
    List<UserDto> findUsersByOrderDate(LocalDate date);
}

// ✅ 올바른 예: User에서 Order를 조인
public interface UserRepository extends JpaRepository<User, Long>, UserRepositorySupport {
}

public interface UserRepositorySupport {
    // From user이므로 UserRepository에 정의됨
    List<UserOrderDto> findUsersWithOrders(LocalDate date);
}
```

### 4. MariaDB 호환성

**QueryDSL 작성 시 MariaDB 특성을 고려해야 합니다**:

```java
// ✅ MariaDB 호환
queryFactory
    .selectFrom(user)
    .where(user.createdAt.between(startDate, endDate))
    .fetch();

// ✅ LIMIT/OFFSET
queryFactory
    .selectFrom(user)
    .limit(10)
    .offset(0)
    .fetch();

// ⚠️ 주의: MariaDB는 특정 윈도우 함수 지원 제한적
// ROW_NUMBER(), RANK() 등 사용 시 버전 확인 필요
```

### 5. xxxRepositorySupport 직접 의존 금지

**반드시** JPA Repository를 통해 사용:

```java
// ❌ 잘못된 예
@Service
public class UserService {
    private final UserRepositoryImpl userRepositoryImpl; // 구현체 직접 주입

    public List<UserDto> getUsers() {
        return userRepositoryImpl.findUserSummaries(...);
    }
}

// ✅ 올바른 예
@Service
public class UserService {
    private final UserRepository userRepository; // 인터페이스 주입

    public List<UserDto> getUsers() {
        return userRepository.findUserSummaries(...);
    }
}
```

## @Transactional 사용 가이드

### 필수 규칙

**각 서비스 메서드에 명시적으로 선언**해야 합니다:

1. **조회 쿼리만 호출하는 public 메서드**: `@Transactional(readOnly = true)`
2. **변경 쿼리를 하나라도 호출하는 public 메서드**: `@Transactional`
3. **조회와 변경 쿼리가 모두 있는 메서드**: `@Transactional`

### 예제

```java
@Service
public class UserService {

    private final UserRepository userRepository;

    // ✅ 읽기 전용 트랜잭션
    @Transactional(readOnly = true)
    public List<User> findAllUsers() {
        return userRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<User> findUserById(Long id) {
        return userRepository.findById(id);
    }

    // ✅ 쓰기 트랜잭션
    @Transactional
    public User createUser(SignUpRequest request) {
        User user = User.create(request.email(), request.password());
        return userRepository.save(user);
    }

    @Transactional
    public User updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
        user.update(request.name(), request.email());
        return user;
    }

    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    // ✅ 조회 + 변경이 모두 있으면 @Transactional
    @Transactional
    public User activateUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
        user.activate(); // 변경
        return user;
    }

    // ✅ 복잡한 비즈니스 로직 (조회 + 변경)
    @Transactional
    public void processUserOrder(Long userId, OrderRequest request) {
        // 조회
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException(userId));

        // 변경
        Order order = Order.create(user, request.items());
        orderRepository.save(order);

        // 변경
        user.addOrder(order);
    }
}
```

### 트랜잭션 전파 (Propagation)

기본값은 `REQUIRED`이며, 대부분의 경우 명시하지 않아도 됩니다:

```java
// 일반적인 경우 (기본값 사용)
@Transactional
public void createUser(SignUpRequest request) { }

// 특수한 경우에만 명시
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void createAuditLog(AuditEvent event) {
    // 별도 트랜잭션으로 실행
}
```

## JPA Entity 설계 가이드

### 1. 기본 구조

```java
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // 정적 팩토리 메서드
    public static User create(String email, String password, String name) {
        User user = new User();
        user.email = email;
        user.password = password;
        user.name = name;
        user.status = UserStatus.ACTIVE;
        return user;
    }

    // 비즈니스 메서드
    public void update(String name, String email) {
        this.name = name;
        this.email = email;
    }

    public void activate() {
        this.status = UserStatus.ACTIVE;
    }

    public void deactivate() {
        this.status = UserStatus.INACTIVE;
    }
}
```

### 2. 연관관계 매핑

```java
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ManyToOne - 지연 로딩 필수
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // OneToMany - 지연 로딩, Cascade 설정
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    // 연관관계 편의 메서드
    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }
}
```

## When to Use This Skill

이 skill은 다음 상황에서 자동으로 적용됩니다:

- JPA Entity 생성 및 수정
- QueryDSL 쿼리 작성
- Repository 인터페이스 및 구현체 작성
- Service 메서드에 @Transactional 추가
- DTO Projection 작성

## Checklist

데이터베이스 관련 코드 작성 시 확인사항:

- [ ] QueryDSL Support가 JPA Repository에 상속되어 있는가?
- [ ] QueryDSL 구현체가 From절에 맞는 Repository에 있는가?
- [ ] DTO Projection에 @QueryProjection이 적용되었는가?
- [ ] Service의 모든 public 메서드에 @Transactional이 명시되었는가?
- [ ] 읽기 전용 메서드에 readOnly = true가 적용되었는가?
- [ ] MariaDB 호환성을 고려했는가?
- [ ] Entity의 연관관계가 지연 로딩(LAZY)으로 설정되었는가?
- [ ] xxxRepositorySupport 구현체를 직접 주입하지 않았는가?

## Examples

### 완전한 예제: 사용자 검색 기능

```java
// 1. DTO
public record UserSearchCondition(String email, String name) {}

public record UserSummaryDto(
    Long id,
    String email,
    String name,
    UserStatus status
) {
    @QueryProjection
    public UserSummaryDto {}
}

// 2. Repository
public interface UserRepository extends JpaRepository<User, Long>, UserRepositorySupport {
}

public interface UserRepositorySupport {
    List<UserSummaryDto> searchUsers(UserSearchCondition condition);
}

@Repository
public class UserRepositoryImpl implements UserRepositorySupport {

    private final JPAQueryFactory queryFactory;

    public UserRepositoryImpl(JPAQueryFactory queryFactory) {
        this.queryFactory = queryFactory;
    }

    @Override
    public List<UserSummaryDto> searchUsers(UserSearchCondition condition) {
        return queryFactory
            .select(new QUserSummaryDto(
                user.id,
                user.email,
                user.name,
                user.status
            ))
            .from(user)
            .where(
                emailContains(condition.email()),
                nameContains(condition.name())
            )
            .orderBy(user.createdAt.desc())
            .fetch();
    }

    private BooleanExpression emailContains(String email) {
        return email != null ? user.email.contains(email) : null;
    }

    private BooleanExpression nameContains(String name) {
        return name != null ? user.name.contains(name) : null;
    }
}

// 3. Service
@Service
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<UserSummaryDto> searchUsers(UserSearchCondition condition) {
        return userRepository.searchUsers(condition);
    }
}

// 4. Controller
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    @GetMapping("/search")
    public List<UserSummaryDto> searchUsers(
        @RequestParam(required = false) String email,
        @RequestParam(required = false) String name
    ) {
        UserSearchCondition condition = new UserSearchCondition(email, name);
        return userService.searchUsers(condition);
    }
}
```
