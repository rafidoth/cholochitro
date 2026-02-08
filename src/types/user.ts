export type UserRole = 'user' | 'admin';

export interface User {
    id: string;
    email: string;
    passwordHash: string;
    displayName: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserResponse {
    id: string;
    email: string;
    displayName: string;
    role: UserRole;
    createdAt: Date;
}

export interface JwtPayload {
    userId: string;
    email: string;
    role: UserRole;
}
