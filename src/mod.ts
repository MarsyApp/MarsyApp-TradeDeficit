import {DependencyContainer} from "tsyringe";
import {IPreAkiLoadMod} from "@spt-aki/models/external/IPreAkiLoadMod";
import {ILogger} from "@spt-aki/models/spt/utils/ILogger";
import {TraderController} from "@spt-aki/controllers/TraderController";
import {SaveServer} from "@spt-aki/servers/SaveServer";
import {ITraderAssort} from "@spt-aki/models/eft/common/tables/ITrader";
import {IMainAkiProfile} from "./models/eft/profile/IAkiProfile";
import {InraidCallbacks} from "@spt-aki/callbacks/InraidCallbacks";
import {ISaveProgressRequestData} from "@spt-aki/models/eft/inRaid/ISaveProgressRequestData";
import {INullResponseData} from "@spt-aki/models/eft/httpResponse/INullResponseData";
import {Item} from "@spt-aki/models/eft/common/tables/IItem";

import * as config from "../config/config.json";
import {RagfairController} from "@spt-aki/controllers/RagfairController";
import {RagfairSortHelper} from "@spt-aki/helpers/RagfairSortHelper";
import {ISearchRequestData} from "@spt-aki/models/eft/ragfair/ISearchRequestData";
import {IPmcData} from "@spt-aki/models/eft/common/IPmcData";
import {IRagfairOffer} from "@spt-aki/models/eft/ragfair/IRagfairOffer";
import {IGetOffersResult} from "@spt-aki/models/eft/ragfair/IGetOffersResult";
import {DynamicRouterModService} from "@spt-aki/services/mod/dynamicRouter/DynamicRouterModService";
import {JsonUtil} from "@spt-aki/utils/JsonUtil";
import {RagfairSort} from "@spt-aki/models/enums/RagfairSort";
import {QuestCallbacks} from "@spt-aki/callbacks/QuestCallbacks";
import {IItemEventRouterResponse} from "@spt-aki/models/eft/itemEvent/IItemEventRouterResponse";
import {ICompleteQuestRequestData} from "@spt-aki/models/eft/quests/ICompleteQuestRequestData";
import {QuestHelper} from "@spt-aki/helpers/QuestHelper";
import {QuestStatus} from "@spt-aki/models/enums/QuestStatus";
import {PreAkiModLoader} from "@spt-aki/loaders/PreAkiModLoader";

class Mod implements IPreAkiLoadMod
{
    private static container: DependencyContainer;
    private router: DynamicRouterModService;
    private jsonUtil: JsonUtil;
    private selfSessionId: string;
    private modLoader: PreAkiModLoader;
    private path = require("path");

    public preAkiLoad(container: DependencyContainer): void
    {
        Mod.container = container;
        this.router = container.resolve<DynamicRouterModService>("DynamicRouterModService");
        this.jsonUtil = container.resolve<JsonUtil>("JsonUtil");
        this.getTraderAssort = this.getTraderAssort.bind(this);


        container.afterResolution("TraderController", (_t, result: TraderController) =>
        {
            const oldGetTraderAssort = result.getAssort.bind(result);
            result.getAssort = (sessionId: string, traderId: string) =>
            {
                return this.getTraderAssort(sessionId, traderId, oldGetTraderAssort);
            }
        }, {frequency: "Always"});

        container.afterResolution("InraidCallbacks", (_t, result: InraidCallbacks) =>
        {
            const oldSaveProgress = result.saveProgress.bind(result);
            result.saveProgress = (url: string, info: ISaveProgressRequestData, sessionID: string) =>
            {
                return this.saveProgress(url, info, sessionID, oldSaveProgress);
            }
        }, {frequency: "Always"});

        if(config.ragfair.enabled) {
            container.afterResolution("RagfairController", (_t, result: RagfairController) =>
            {
                const oldGetOffers = result.getOffers.bind(result);
                // const oldAddIndexValueToOffers = result.addIndexValueToOffers.bind(result);
                result.getOffers = (sessionID: string, searchRequest: ISearchRequestData) =>
                {
                    return this.getOffers(sessionID, searchRequest, oldGetOffers);
                }
                /* result.addIndexValueToOffers = (offers: IRagfairOffer[]) => {
                    return this.addIndexValueToOffers(offers, oldAddIndexValueToOffers);
                }*/
            }, {frequency: "Always"});

            container.afterResolution("RagfairSortHelper", (_t, result: RagfairSortHelper) =>
            {
                const oldSortOffers = result.sortOffers.bind(result);
                result.sortOffers = (offers: IRagfairOffer[], type: RagfairSort, direction?: number) =>
                {
                    return this.sortOffers(offers, type, direction, oldSortOffers);
                }
            }, {frequency: "Always"});
        }

        if(config.quests.enabled) {
            container.afterResolution("QuestCallbacks", (_t, result: QuestCallbacks) => {
                // const oldAcceptQuest = result.acceptQuest.bind(result);
                const oldCompleteQuest = result.completeQuest.bind(result);
                // const oldHandoverQuest = result.handoverQuest.bind(result);
                /*result.acceptQuest = (pmcData: IPmcData, body: IAcceptQuestRequestData, sessionID: string) =>
                {
                    return this.acceptQuest(pmcData, body, sessionID, oldAcceptQuest);
                }*/
                result.completeQuest = (pmcData: IPmcData, body: ICompleteQuestRequestData, sessionID: string) => {
                    return this.completeQuest(pmcData, body, sessionID, oldCompleteQuest);
                }
                /*result.handoverQuest = (pmcData: IPmcData, body: IHandoverQuestRequestData, sessionID: string) =>
                {
                    return this.handoverQuest(pmcData, body, sessionID, oldHandoverQuest);
                }*/
            },
            {frequency: "Always"});
        }

        this.hookRoutes();
    }

    public postAkiLoad(container: DependencyContainer): void
    {
        this.modLoader = container.resolve<PreAkiModLoader>("PreAkiModLoader");
    }

    private hookRoutes(): void
    {
        this.router.registerDynamicRouter(
            "TradeDeficit",
            [
                {
                    url: "/TradeDeficit/GetData",
                    action: (url, info, sessionId, output) =>
                    {
                        return this.getData(url, info, sessionId, output)
                    }
                },
                {
                    url: "/TradeDeficit/GetInfo",
                    action: (url, info, sessionId, output) =>
                    {
                        return this.getModInfo(url, info, sessionId, output)
                    }
                }
            ],
            "TradeDeficit"
        )
    }

    private getModInfo(url: string, info: any, sessionId: string, output: string): string
    {
        const modOutput = {
            status: 1,
            data: null
        };

        modOutput.data = {...{path: this.path.resolve(this.modLoader.getModPath("MarsyApp-TradeDeficit"))}};
        modOutput.status = 0;

        return this.jsonUtil.serialize(modOutput);
    }

    private getData(url: string, info: any, sessionId: string, output: string): string
    {
        const modOutput = {
            status: 1,
            data: null
        };

        const profile = this.getProfile(sessionId);

        if (!profile.tradeDeficitItems)
        {
            profile.tradeDeficitItems = [];
        }

        modOutput.data = {TradeDeficitItems: profile.tradeDeficitItems, TradeDeficitItemsIgnore: config.ignoreList || []}
        modOutput.status = 0;

        return this.jsonUtil.serialize(modOutput);
    }

    private saveProgress(url: string, info: ISaveProgressRequestData, sessionID: string, oldSaveProgress: (url: string, info: ISaveProgressRequestData, sessionID: string) => INullResponseData): INullResponseData
    {

        if (info.exit === "survived")
        {
            this.unlockItems(info.profile.Inventory.items, sessionID);
        }
        else if (info.exit !== "runner" && config.saveOnDeath)
        {
            const itemsMap = new Map<string, Item>();
            info.profile.Inventory.items.forEach((item) =>
            {
                itemsMap.set(item._id, item);
            });

            const saveItems = info.profile.Inventory.items.filter((item) =>
            {
                return this.inSavageContainer(item, itemsMap);
            });

            this.unlockItems(saveItems, sessionID);
        }

        return oldSaveProgress(url, info, sessionID);
    }

    private inSavageContainer(item: Item, itemsMap: Map<string, Item>): boolean
    {
        if (item.parentId)
        {
            const parentItem = itemsMap.get(item.parentId);
            if (parentItem?.slotId === "SecuredContainer")
            {
                return true;
            }
            return this.inSavageContainer(parentItem, itemsMap);
        }

        return false;
    }

    private getTraderAssort(sessionId: string, traderId: string, oldGetTraderAssort: (sessionId: string, traderId: string) => ITraderAssort)
    {
        const assort = oldGetTraderAssort(sessionId, traderId);
        const profile = this.getProfile(sessionId);

        if (!profile.tradeDeficitItems)
        {
            profile.tradeDeficitItems = [];
        }

        const needDelete = true;

        if (needDelete)
        {
            assort.items = assort.items.filter((item) =>
            {
                return profile.tradeDeficitItems.includes(item._tpl) || config.ignoreList.includes(item._tpl);
            });
        }
        else
        {
            assort.items.map((item) =>
            {
                if (!profile.tradeDeficitItems.includes(item._tpl))
                {
                    item.upd = {
                        "UnlimitedCount": false,
                        "StackObjectsCount": 0
                    }
                }

                return item;
            });
        }

        return assort;
    }

    /*private acceptQuest(pmcData: IPmcData, body: IAcceptQuestRequestData, sessionID: string, oldAcceptQuest: (pmcData: IPmcData, body: IAcceptQuestRequestData, sessionID: string) => IItemEventRouterResponse): IItemEventRouterResponse {
        return oldAcceptQuest(pmcData, body, sessionID);
    }*/

    private completeQuest(pmcData: IPmcData, body: ICompleteQuestRequestData, sessionID: string, oldCompleteQuest: (pmcData: IPmcData, body: ICompleteQuestRequestData, sessionID: string) => IItemEventRouterResponse): IItemEventRouterResponse {
        const questHelper = Mod.container.resolve<QuestHelper>("QuestHelper");
        const quest = questHelper.getQuestFromDb(body.qid, pmcData);
        const questRewardItems = questHelper.getQuestRewardItems(quest, QuestStatus.Success);
        this.unlockItems(questRewardItems, sessionID);
        return oldCompleteQuest(pmcData, body, sessionID);
    }

    /*private handoverQuest(pmcData: IPmcData, body: IHandoverQuestRequestData, sessionID: string, oldHandoverQuest: (pmcData: IPmcData, body: IHandoverQuestRequestData, sessionID: string) => IItemEventRouterResponse): IItemEventRouterResponse {
        return oldHandoverQuest(pmcData, body, sessionID);
    }*/

    private sortOffers(offers: IRagfairOffer[], type: RagfairSort, direction?: number, oldSortOffers?: (offers: IRagfairOffer[], type: RagfairSort, direction?: number) => IRagfairOffer[]): IRagfairOffer[]
    {
        return oldSortOffers(this.getOffersForSearchType(offers, this.selfSessionId), type, direction);
    }

    private getOffers(sessionID: string, searchRequest: ISearchRequestData, getOffers: (sessionID: string, searchRequest: ISearchRequestData) => IGetOffersResult): IGetOffersResult
    {
        this.selfSessionId = sessionID;
        return getOffers(sessionID, searchRequest);
    }

    private getOffersForSearchType(offers: IRagfairOffer[], sessionID: string): IRagfairOffer[]
    {
        const profile = this.getProfile(sessionID);

        if (!profile.tradeDeficitItems)
        {
            profile.tradeDeficitItems = [];
        }

        offers = offers.filter((offer) =>
        {
            return offer.items.every((item) =>
            {
                /*if(!(profile.tradeDeficitItems.includes(item._tpl) || config.ignoreList.includes(item._tpl))) {
                }*/
                return profile.tradeDeficitItems.includes(item._tpl) || config.ignoreList.includes(item._tpl);
            });
        });

        if(config.ragfair.showOnlyWhenAvailable) {
            offers = this.getFilterHasItems(offers, sessionID);
        }
        return offers;
    }

    private getFilterHasItems(offers: IRagfairOffer[], sessionID: string): IRagfairOffer[]
    {
        const profile = this.getProfile(sessionID);
        const mayInventory = profile.characters.pmc.Inventory.items;
        let have = 0;
        let dontHave = 0;
        offers = offers.filter((item) =>
        {

            if (!item.requirements.every((item) =>
            {
                return mayInventory.some((inventoryItem) => {
                    return inventoryItem._tpl === item._tpl;
                });
            }))
            {
                dontHave++;
                return false;
            }
            else
            {
                have++;
                return true;
            }
        })

        return offers;
    }

    private getProfile(sessionId: string): IMainAkiProfile
    {
        const saveServer = Mod.container.resolve<SaveServer>("SaveServer");
        return <IMainAkiProfile>saveServer.getProfile(sessionId);
    }

    private unlockItems(items: Item[], sessionID: string): void
    {
        const logger = Mod.container.resolve<ILogger>("WinstonLogger");

        const profile = this.getProfile(sessionID);
        if (!profile.tradeDeficitItems)
        {
            profile.tradeDeficitItems = [];
        }

        const origCount = profile.tradeDeficitItems.length;
        for (const item of items)
        {
            if (!item._tpl || profile.tradeDeficitItems.includes(item._tpl)) continue;
            profile.tradeDeficitItems.push(item._tpl);
            logger.info(`[tradeDeficitItems] Unlocked ${item._tpl} for player ${profile.info?.username}`)
        }
        logger.info(`[tradeDeficitItems] Unlocked ${profile.tradeDeficitItems.length - origCount} items for player ${profile.info?.username}`)
    }
}

module.exports = {mod: new Mod()}