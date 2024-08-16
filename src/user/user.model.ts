export class UserEventModel {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  created: Date;
  hasGrantedAccess: boolean;
  grantedAccessOn: Date;
}
