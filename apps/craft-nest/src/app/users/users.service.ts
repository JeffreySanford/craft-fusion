import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { User } from './user.interface';

@Injectable()
export class UsersService {

    findOne(username: string): Observable<User> {
        
        return new Observable(observer => {
            observer.next({
                id: '0', username: username, password: 'changeme',
                firstName: '',
                lastName: '',
                role: '',
                email: '',
                phoneNumber: '',
                address: '',
                city: '',
                state: '',
                zip: '',
                country: '',
                createdAt: new Date(),
                updatedAt: new Date() || undefined,
                lastLogin: new Date() || undefined,
                isActive: false,
                isAdmin: false,
                isVerified: false,
                profilePicture: '',
                bio: '',
                website: '',
                socialMedia: {
                    facebook: '',
                    twitter: '',
                    instagram: '',
                    linkedin: ''
                },
                preferences: {
                    theme: ''
                },
                notifications: {
                    email: false,
                    sms: false,
                    push: false
                }
            });
            observer.complete();
        });
    }

    create(user: User): Observable<User> {
        
        return new Observable(observer => {
            observer.next(user);
            observer.complete();
        });
    }

    update(user: User): Observable<User> {
        
        return new Observable(observer => {
            observer.next(user);
            observer.complete();
        });
    }

    getAllUsers(): Observable<User[]> {
        return new Observable(observer => {
            observer.next([]);
            observer.complete();
        });
    }

    delete(user: User): Observable<User> {
        
        return new Observable(observer => {
            observer.next(user);
            observer.complete();
        });
    }   

    getUserById(id: number): Observable<User> {
        return new Observable(observer => {
            observer.next({
                id: id.toString(), username: 'user' + id, password: 'changeme',
                firstName: '',
                lastName: '',
                role: '',
                email: '',
                phoneNumber: '',
                address: '',
                city: '',
                state: '',
                zip: '',
                country: '',
                createdAt: new Date(),
                updatedAt: new Date() || undefined,
                lastLogin: new Date() || undefined,
                isActive: false,
                isAdmin: false,
                isVerified: false,
                profilePicture: '',
                bio: '',
                website: '',
                socialMedia: {
                    facebook: '',
                    twitter: '',
                    instagram: '',
                    linkedin: ''
                },
                preferences: {
                    theme: ''
                },
                notifications: {
                    email: false,
                    sms: false,
                    push: false
                }
            });
            observer.complete();
        });
    }
}
