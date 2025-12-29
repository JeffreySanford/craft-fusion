export interface User {
    username: string,
    password: string,
    id: string,
    firstName: string,
    lastName: string,
    role: string,
    email: string,
    phoneNumber: string,
    address: string,
    city: string,
    state: string,
    zip: string,
    country: string,
    createdAt: Date,
    updatedAt: Date,
    lastLogin: Date,
    isActive: boolean,
    isAdmin: boolean,
    isVerified: boolean,
    profilePicture: string,
    bio: string,
    website: string,
    socialMedia: {
        facebook: string,
        twitter: string,
        instagram: string,
        linkedin: string
    },
    preferences: {
        theme: string,
    },
    notifications: {
        email: boolean,
        sms: boolean,
        push: boolean
    }
}