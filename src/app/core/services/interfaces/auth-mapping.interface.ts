import { SignInPayload, SignUpPayload} from "../../models/auth.model";
import { Person } from "../../models/person.model";
import { User } from "../../models/user.model";

export interface IAuthMapping{
    signInPayload(payload:SignInPayload):any;
    signUpPayload(payload:SignUpPayload):any;
    signIn(response:any):User;
    signUp(response:any):User;
    me(response:any):User;
  }