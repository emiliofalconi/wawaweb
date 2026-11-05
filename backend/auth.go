package backend

import (
	"context"
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type contextKey string

const UserContextKey = contextKey("user_id")

var jwtSecretKey []byte

func getJwtSecret() []byte {
	if len(jwtSecretKey) == 0 {
		sec := os.Getenv("JWT_SECRET")
		if sec == "" {
			sec = "wawaweb-production-secret-key-coil-202715"
		}
		jwtSecretKey = []byte(sec)
	}
	return jwtSecretKey
}

type Claims struct {
	UserID int64  `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

func GenerateToken(userID int64, email string) (string, error) {
	expirationTime := time.Now().Add(7 * 24 * time.Hour) // 7 días de validez
	claims := &Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "wawaweb-api",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getJwtSecret())
}

func ParseToken(tokenStr string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		return getJwtSecret(), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("token inválido o expirado")
	}
	return claims, nil
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// AuthMiddleware valida el token Bearer o cookie de sesión
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		tokenStr := ""

		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
		} else if cookie, err := r.Cookie("wawaweb_token"); err == nil {
			tokenStr = cookie.Value
		}

		if tokenStr == "" {
			http.Error(w, `{"error":"Acceso no autorizado: token faltante"}`, http.StatusUnauthorized)
			return
		}

		claims, err := ParseToken(tokenStr)
		if err != nil {
			http.Error(w, `{"error":"Acceso no autorizado: token inválido o expirado"}`, http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserContextKey, claims.UserID)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

func GetUserIDFromContext(ctx context.Context) (int64, bool) {
	val := ctx.Value(UserContextKey)
	if val == nil {
		return 0, false
	}
	uid, ok := val.(int64)
	return uid, ok
}

