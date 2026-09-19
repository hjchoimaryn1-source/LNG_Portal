// src/lib/rbac/passwordHash.ts
//
// PURPOSE
//   신규 User & Security 계정(user_accounts.password_hash)용 해싱 유틸.
//   Step 0 확인 결과 bcrypt/bcryptjs/argon2 미설치(package.json) — 새 의존성을
//   추가하지 않고 Node 내장 crypto.scrypt(salt + timing-safe compare)로
//   구현한다. hashPassword()/verifyPassword() 뒤로 구현을 격리해 추후 라이브러리
//   교체가 필요해지면 이 파일만 바꾸면 되게 한다.

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const DERIVED_KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/** "saltHex:derivedKeyHex" 형식의 해시 문자열을 반환한다. */
export function hashPassword(plainPassword: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = scryptSync(plainPassword, salt, DERIVED_KEY_LENGTH);
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

/** 저장된 해시와 평문 비밀번호를 timing-safe하게 비교한다. */
export function verifyPassword(plainPassword: string, storedHash: string): boolean {
  const [saltHex, keyHex] = storedHash.split(':');
  if (!saltHex || !keyHex) return false;

  const salt = Buffer.from(saltHex, 'hex');
  const storedKey = Buffer.from(keyHex, 'hex');
  const derivedKey = scryptSync(plainPassword, salt, DERIVED_KEY_LENGTH);

  if (derivedKey.length !== storedKey.length) return false;
  return timingSafeEqual(derivedKey, storedKey);
}

/** 부트스트랩/리셋 임시 비밀번호 생성 — 사람이 옮겨 적기 쉬운 12자(base64url). */
export function generateTempPassword(): string {
  return randomBytes(9).toString('base64url').slice(0, 12);
}
