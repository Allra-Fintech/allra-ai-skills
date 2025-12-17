---
name: allra-error-handling
description: Allra 백엔드 에러 핸들링 및 예외 처리 표준. Use when handling errors, creating custom exceptions, or implementing error responses.
---

# Allra Backend 에러 핸들링 표준

Allra 백엔드 팀의 에러 핸들링, 예외 처리, 로깅 표준을 정의합니다.

## 예외 클래스 설계

### 1. 비즈니스 예외 계층 구조

```java
// 최상위 비즈니스 예외
public abstract class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    protected BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    protected BusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public int getStatus() {
        return errorCode.getStatus();
    }
}

// ErrorCode Enum
public enum ErrorCode {
    // 400 Bad Request
    INVALID_INPUT_VALUE(400, "E001", "잘못된 입력값입니다"),
    INVALID_TYPE_VALUE(400, "E002", "잘못된 타입입니다"),

    // 401 Unauthorized
    UNAUTHORIZED(401, "E101", "인증이 필요합니다"),
    INVALID_TOKEN(401, "E102", "유효하지 않은 토큰입니다"),
    EXPIRED_TOKEN(401, "E103", "만료된 토큰입니다"),

    // 403 Forbidden
    FORBIDDEN(403, "E201", "권한이 없습니다"),

    // 404 Not Found
    ENTITY_NOT_FOUND(404, "E301", "요청한 리소스를 찾을 수 없습니다"),
    USER_NOT_FOUND(404, "E302", "사용자를 찾을 수 없습니다"),

    // 409 Conflict
    DUPLICATE_RESOURCE(409, "E401", "이미 존재하는 리소스입니다"),

    // 500 Internal Server Error
    INTERNAL_SERVER_ERROR(500, "E999", "서버 내부 오류가 발생했습니다");

    private final int status;
    private final String code;
    private final String message;

    ErrorCode(int status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }

    public int getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
```

### 2. 도메인별 예외 클래스

```java
// 엔티티를 찾을 수 없을 때
public class EntityNotFoundException extends BusinessException {

    public EntityNotFoundException(String entityName, Long id) {
        super(ErrorCode.ENTITY_NOT_FOUND,
              String.format("%s(id=%d)을 찾을 수 없습니다", entityName, id));
    }
}

// 사용자 관련 예외
public class UserNotFoundException extends BusinessException {

    public UserNotFoundException(Long userId) {
        super(ErrorCode.USER_NOT_FOUND,
              String.format("사용자(id=%d)를 찾을 수 없습니다", userId));
    }

    public UserNotFoundException(String email) {
        super(ErrorCode.USER_NOT_FOUND,
              String.format("사용자(email=%s)를 찾을 수 없습니다", email));
    }
}

// 중복 리소스 예외
public class DuplicateResourceException extends BusinessException {

    public DuplicateResourceException(String resourceName, String field, String value) {
        super(ErrorCode.DUPLICATE_RESOURCE,
              String.format("%s의 %s=%s가 이미 존재합니다", resourceName, field, value));
    }
}

// 인증/인가 예외
public class UnauthorizedException extends BusinessException {

    public UnauthorizedException() {
        super(ErrorCode.UNAUTHORIZED);
    }

    public UnauthorizedException(String message) {
        super(ErrorCode.UNAUTHORIZED, message);
    }
}

public class ForbiddenException extends BusinessException {

    public ForbiddenException() {
        super(ErrorCode.FORBIDDEN);
    }

    public ForbiddenException(String message) {
        super(ErrorCode.FORBIDDEN, message);
    }
}
```

## Global Exception Handler

### @RestControllerAdvice 구현

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // 비즈니스 예외 처리
    @ExceptionHandler(BusinessException.class)
    protected ResponseEntity<ErrorResponse> handleBusinessException(BusinessException e) {
        log.warn("BusinessException: code={}, message={}",
                 e.getErrorCode().getCode(), e.getMessage());

        ErrorResponse response = ErrorResponse.of(e.getErrorCode(), e.getMessage());
        return ResponseEntity
            .status(e.getStatus())
            .body(response);
    }

    // Bean Validation 예외 처리
    @ExceptionHandler(MethodArgumentNotValidException.class)
    protected ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException e) {

        log.warn("MethodArgumentNotValidException: {}", e.getMessage());

        List<ErrorResponse.FieldError> fieldErrors = e.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(error -> new ErrorResponse.FieldError(
                error.getField(),
                error.getRejectedValue() != null ? error.getRejectedValue().toString() : null,
                error.getDefaultMessage()
            ))
            .toList();

        ErrorResponse response = ErrorResponse.of(ErrorCode.INVALID_INPUT_VALUE, fieldErrors);
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(response);
    }

    // 인증 예외 처리
    @ExceptionHandler(AuthenticationException.class)
    protected ResponseEntity<ErrorResponse> handleAuthenticationException(
            AuthenticationException e) {

        log.warn("AuthenticationException: {}", e.getMessage());

        ErrorResponse response = ErrorResponse.of(
            ErrorCode.UNAUTHORIZED,
            e.getMessage()
        );
        return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(response);
    }

    // 권한 예외 처리
    @ExceptionHandler(AccessDeniedException.class)
    protected ResponseEntity<ErrorResponse> handleAccessDeniedException(
            AccessDeniedException e) {

        log.warn("AccessDeniedException: {}", e.getMessage());

        ErrorResponse response = ErrorResponse.of(
            ErrorCode.FORBIDDEN,
            "접근 권한이 없습니다"
        );
        return ResponseEntity
            .status(HttpStatus.FORBIDDEN)
            .body(response);
    }

    // 예상하지 못한 예외 처리
    @ExceptionHandler(Exception.class)
    protected ResponseEntity<ErrorResponse> handleException(Exception e) {
        log.error("Unexpected exception occurred", e);

        ErrorResponse response = ErrorResponse.of(
            ErrorCode.INTERNAL_SERVER_ERROR,
            "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        );
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(response);
    }
}
```

## 에러 응답 형식

### ErrorResponse DTO

```java
public record ErrorResponse(
    String code,
    String message,
    List<FieldError> errors,
    LocalDateTime timestamp
) {

    public static ErrorResponse of(ErrorCode errorCode) {
        return new ErrorResponse(
            errorCode.getCode(),
            errorCode.getMessage(),
            Collections.emptyList(),
            LocalDateTime.now()
        );
    }

    public static ErrorResponse of(ErrorCode errorCode, String message) {
        return new ErrorResponse(
            errorCode.getCode(),
            message,
            Collections.emptyList(),
            LocalDateTime.now()
        );
    }

    public static ErrorResponse of(ErrorCode errorCode, List<FieldError> errors) {
        return new ErrorResponse(
            errorCode.getCode(),
            errorCode.getMessage(),
            errors,
            LocalDateTime.now()
        );
    }

    public record FieldError(
        String field,
        String rejectedValue,
        String message
    ) {}
}
```

### 에러 응답 예시

**단일 에러:**
```json
{
  "code": "E302",
  "message": "사용자(id=123)를 찾을 수 없습니다",
  "errors": [],
  "timestamp": "2024-12-17T10:30:00"
}
```

**Validation 에러:**
```json
{
  "code": "E001",
  "message": "잘못된 입력값입니다",
  "errors": [
    {
      "field": "email",
      "rejectedValue": "invalid-email",
      "message": "올바른 이메일 형식이 아닙니다"
    },
    {
      "field": "password",
      "rejectedValue": "123",
      "message": "비밀번호는 최소 8자 이상이어야 합니다"
    }
  ],
  "timestamp": "2024-12-17T10:30:00"
}
```

## 서비스 레이어에서 예외 사용

### 1. 엔티티 조회 시 예외 처리

```java
@Service
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public User findUserById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
    }

    @Transactional(readOnly = true)
    public User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new UserNotFoundException(email));
    }
}
```

### 2. 비즈니스 로직 검증

```java
@Service
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public User createUser(SignUpRequest request) {
        // 중복 체크
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("User", "email", request.email());
        }

        User user = User.create(request.email(), request.password(), request.name());
        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id, Long currentUserId) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));

        // 권한 체크
        if (!user.getId().equals(currentUserId)) {
            throw new ForbiddenException("본인의 계정만 삭제할 수 있습니다");
        }

        userRepository.delete(user);
    }
}
```

## 로깅 전략

### 1. 로깅 레벨

```java
@Service
@Slf4j
public class UserService {

    // DEBUG: 개발 시 디버깅 정보
    log.debug("Finding user by id: {}", id);

    // INFO: 정상적인 비즈니스 플로우
    log.info("User created successfully: userId={}", user.getId());

    // WARN: 비즈니스 예외 (예상된 에러)
    log.warn("User not found: userId={}", id);

    // ERROR: 시스템 예외 (예상하지 못한 에러)
    log.error("Unexpected error occurred while creating user", e);
}
```

### 2. 로깅 포맷

```java
// ✅ 올바른 로깅 (구조화된 정보)
log.info("User signup completed: userId={}, email={}, signupAt={}",
         user.getId(), user.getEmail(), LocalDateTime.now());

log.warn("Failed login attempt: email={}, reason={}",
         email, "Invalid password");

// ❌ 잘못된 로깅 (단순 문자열)
log.info("User " + user.getId() + " signed up");
log.warn("Login failed for " + email);
```

## When to Use This Skill

이 skill은 다음 상황에서 자동으로 적용됩니다:

- 커스텀 예외 클래스 생성
- Service 레이어에서 예외 throw
- Global Exception Handler 구현
- 에러 응답 DTO 작성
- 로깅 코드 작성

## Checklist

에러 핸들링 코드 작성 시 확인사항:

- [ ] 비즈니스 예외는 BusinessException을 상속하는가?
- [ ] ErrorCode enum에 적절한 HTTP 상태 코드가 정의되었는가?
- [ ] Global Exception Handler에 예외 처리가 추가되었는가?
- [ ] 에러 응답이 표준 형식(ErrorResponse)을 따르는가?
- [ ] 비즈니스 예외는 WARN 레벨로 로깅하는가?
- [ ] 시스템 예외는 ERROR 레벨로 로깅하는가?
- [ ] 민감한 정보(비밀번호 등)가 로그에 포함되지 않는가?
- [ ] orElseThrow를 사용해 Optional을 처리하는가?

## Examples

### 완전한 예제: 주문 생성 API

```java
// 1. Custom Exception
public class InsufficientStockException extends BusinessException {
    public InsufficientStockException(String productName, int requested, int available) {
        super(ErrorCode.CONFLICT,
              String.format("%s의 재고가 부족합니다. 요청: %d, 재고: %d",
                          productName, requested, available));
    }
}

// 2. Service
@Service
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional
    public Order createOrder(Long userId, CreateOrderRequest request) {
        // 사용자 조회
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException(userId));

        log.info("Creating order: userId={}, itemCount={}", userId, request.items().size());

        // 상품 및 재고 확인
        for (OrderItemRequest item : request.items()) {
            Product product = productRepository.findById(item.productId())
                .orElseThrow(() -> new EntityNotFoundException("Product", item.productId()));

            if (product.getStock() < item.quantity()) {
                log.warn("Insufficient stock: productId={}, requested={}, available={}",
                        product.getId(), item.quantity(), product.getStock());
                throw new InsufficientStockException(
                    product.getName(),
                    item.quantity(),
                    product.getStock()
                );
            }

            // 재고 차감
            product.decreaseStock(item.quantity());
        }

        // 주문 생성
        Order order = Order.create(user, request.items());
        Order savedOrder = orderRepository.save(order);

        log.info("Order created successfully: orderId={}, userId={}, totalAmount={}",
                savedOrder.getId(), userId, savedOrder.getTotalAmount());

        return savedOrder;
    }
}

// 3. Controller
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @AuthenticationPrincipal Long userId,
            @RequestBody @Valid CreateOrderRequest request) {

        Order order = orderService.createOrder(userId, request);
        OrderResponse response = OrderResponse.from(order);
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(response);
    }
}
```

**에러 응답 예시:**

```json
// 재고 부족 에러 (409 Conflict)
{
  "code": "E401",
  "message": "맥북 프로의 재고가 부족합니다. 요청: 5, 재고: 2",
  "errors": [],
  "timestamp": "2024-12-17T10:30:00"
}

// 사용자 없음 에러 (404 Not Found)
{
  "code": "E302",
  "message": "사용자(id=999)를 찾을 수 없습니다",
  "errors": [],
  "timestamp": "2024-12-17T10:30:00"
}
```
