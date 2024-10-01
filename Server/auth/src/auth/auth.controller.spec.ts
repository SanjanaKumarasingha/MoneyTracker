// import { Test, TestingModule } from '@nestjs/testing';
// import { AuthController } from './auth.controller';

// describe('AuthController', () => {
//   let controller: AuthController;

//   beforeEach(async () => {

//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [AuthController],
//     }).compile();

//     controller = module.get<AuthController>(AuthController);
//   });

//   // it('should be defined', () => {
//   //   expect(controller).toBeDefined();
//   // }
//   // );

//   it('should return access token', async () => {
//     const signInDto = {
//       username: 'test',
//       password: 'test',
//     };
//     const response = await controller.signIn(signInDto);
//     expect(response.access_token).toBeDefined();
//   }
//   );  

//   it('should return UnauthorizedException, password', async () => {
//     const signInDto = {
//       username: 'test',
//       password: 'wrong',
//     };
//     try {
//       await controller.signIn(signInDto);
//     } catch (error) {
//       expect(error.status).toBe(401);
//     }
//   }
//   );

//   it('should return UnauthorizedException, username', async () => {
//     const signInDto = {
//       username: 'wrong',
//       password: 'test',
//     };
//     try {
//       await controller.signIn(signInDto);
//     } catch (error) {
//       expect(error.status).toBe(401);
//     }
//   }
//   );

//   it('should return UnauthorizedException, both', async () => {
//     const signInDto = {
//       username: 'wrong',
//       password: 'wrong',
//     };
//     try {
//       await controller.signIn(signInDto);
//     } catch (error) {
//       expect(error.status).toBe(401);
//     }
//   }
//   );

//   it('should return UnauthorizedException, empty', async () => {
//     const signInDto = {
//       username: '',
//       password: '',
//     };
//     try {
//       await controller.signIn(signInDto);
//     } catch (error) {
//       expect(error.status).toBe(401);
//     }
//   }
//   );

// });
