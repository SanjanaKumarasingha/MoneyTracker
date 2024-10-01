// import { Injectable } from '@nestjs/common';

// // This should be a real class/interface representing a user entity
// export type User = any;

// @Injectable()
// export class UsersService {
//   private readonly users = [
//     {
//       userId: 1,
//       username: 'john',
//       password: 'changeme',
//     },
//     {
//       userId: 2,
//       username: 'maria',
//       password: 'guess',
//     },
//   ];

//   async findOne(username: string): Promise<User | undefined> {
//     return this.users.find(user => user.username === username);
//   }
// }


import { Injectable } from '@nestjs/common';

@Injectable()

export class UsersService {

  private readonly users = [
    {
      userId: 1,
      username: 'john',
      password: 'changeme',
    },
    {
      userId: 2,
      username: 'maria',
      password: 'guess',
    },
  ];

  async findOne(username: string): Promise<any | undefined> {
    return this.users.find(user => user.username === username);
  }

  async create(username: string, password: string): Promise<any> {
    const newUser = {
      userId: this.users.length + 1,
      username,
      password,
    };

    this.users.push(newUser);
    return newUser;
  }

  async validateToken(token: string): Promise<any> {
    return this.users.find(user => user.username === token);
  }
}
