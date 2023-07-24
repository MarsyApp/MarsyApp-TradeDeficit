import {IAkiProfile} from "@spt-aki/models/eft/profile/IAkiProfile";

export interface IMainAkiProfile extends IAkiProfile {
    tradeDeficitItems: string[];
}
