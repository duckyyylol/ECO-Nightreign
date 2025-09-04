import { randomUUID } from "crypto";
import { Client } from "discord.js";
import { existsSync, writeFileSync } from "fs";
import { readJsonSync, writeJSON, writeJsonSync, writeJSONSync } from "fs-extra";
import { join } from "path";
import { LazyNightfarer } from "../commands/register";
import { memoryUsage, off } from "process";

export enum PointValues {
    EVERGAOL = 2,
    RAID = 2,
    BOSS = 3,
    NIGHTLORD = 5,
    FINISH_FIRST = 5,
    FINISH_SECOND = 4,
    FINISH_THIRD = 3,
    FINISH_FOURTH = 2,
    FINISH_FIFTH = 1,
    RUNES_BONUS_SINGLE = 1
}
export enum PointDeductionValues {
    EXPEDITION_LOST = 5,
    PLAYER_KNOCK = 0.25,
    MISSED_EVENT = 1
}

export interface PointSource {
    id: string;
    amount: PointValues | PointDeductionValues;
    emoji_name: string;
    display: string;
    group: number;
}

export const pointValuesSafe: PointSource[] = [
    {
        display: "Defeated Boss/Greater Enemy",
        id: "boss",
        amount: PointValues.BOSS,
        emoji_name: "bossicon",
        group: 1
    },
    {
        display: "Defeated Evergaol",
        id: "evergaol",
        amount: PointValues.EVERGAOL,
        emoji_name: "evergaol",
        group: 1
    },
    {
        display: "Completed Raid",
        id: "raid",
        amount: PointValues.RAID,
        emoji_name: "raid",
        group: 1
    },
    {
        display: "Defeated Nightlord",
        id: "nightlord",
        amount: PointValues.NIGHTLORD,
        emoji_name: "nightaspect",
        group: 1
    },
    {
        display: "Finished First",
        id: "finish1",
        amount: PointValues.FINISH_FIRST,
        emoji_name: "finish_1",
        group: 2
    },
    {
        display: "Finished Second",
        id: "finish2",
        amount: PointValues.FINISH_SECOND,
        emoji_name: "finish_2",
        group: 2
    },
    {
        display: "Finished Third",
        id: "finish3",
        amount: PointValues.FINISH_THIRD,
        emoji_name: "finish_3",
        group: 2
    },
    {
        display: "Finished Fourth",
        id: "finish4",
        amount: PointValues.FINISH_FOURTH,
        emoji_name: "finish_4",
        group: 2
    },
    {
        display: "Finished Fifth",
        id: "finish5",
        amount: PointValues.FINISH_FIFTH,
        emoji_name: "finish_5",
        group: 2
    },
    {
        display: "Lost Expedition",
        id: "loss",
        amount: PointDeductionValues.EXPEDITION_LOST,
        emoji_name: "loss",
        group: 3
    },
    {
        display: "Missed Raid",
        id: "missraid",
        amount: PointDeductionValues.MISSED_EVENT,
        emoji_name: "raid",
        group: 3
    },
    {
        display: "Player Downed",
        id: "playerdown",
        amount: PointDeductionValues.PLAYER_KNOCK,
        emoji_name: "downed",
        group: 3
    }

]



export const pointGroups = {
    1: "📍 Expedition Objectives",
    2: "🏆 Placement Bonuses",
    3: "⛔ Point Deductions"
}


export const runeBonusThreshold = 100e3

export enum TeamRoles {
    LEADER = 2,
    MEMBER = 1
}

export interface TeamMemberMeta {
    kills: number;
    downs: number;
    runes_total: number;
}

export interface TeamMember {
    id: string;
    role: TeamRoles;
    nightfarerLazy: LazyNightfarer;
    metadata: TeamMemberMeta;
}

export interface TeamMeta {
    points: number;
    runes_avg: number;
    losses: number;
}

export interface Team {
    id: string;
    name: string;
    members: TeamMember[];
    metadata: TeamMeta;
}

interface TeamsData {
    [teamId: string]: Team;
}
export interface LazyStoredMember {
    id: string;
    registered: boolean;
    nightfarerLazy: LazyNightfarer;

}
interface RegisteredUsersData {
    [userId: string]: LazyStoredMember;
}

export interface BotConfig {
    setup: boolean;
    channels: {
        panel: string | null;
        leaderboard: string | null;
    }
    roles: {
        host: string | null;
    }
    messages: {
        panel: string | null;
        leaderboard: string | null;
    }
}

interface APIStruct {
    config: BotConfig;
    teams: TeamsData;
    registered_users: RegisteredUsersData;
}

const botConfig: BotConfig = {
    setup: false,
    channels: {
        panel: null,
        leaderboard: null,
    },
    roles: {
        host: null,
    },
    messages: {
        leaderboard: null,
        panel: null
    }
}


export class TeamManager {
    client: Client;
    dataPath = join(process.cwd(), "data", "data.json");
    constructor(client: Client) {
        this.client = client;
        let initData: APIStruct = { config: botConfig, teams: {}, registered_users: {} }
        if (!existsSync(this.dataPath)) writeJSONSync(this.dataPath, initData, { encoding: "utf8" })
    }

    toggleSetup(): boolean {
        try {

            let json = this.getTeamData();

            json.config.setup = !(json.config.setup)
            writeJSONSync(this.dataPath, json, { encoding: "utf8" })
            return true;
        } catch (e) {
            return false;
        }
    }

    getConfigValue(key: string): any {
        let json = this.getTeamData().config;
        let keys = key.split(/\./gim)
        let v = json;
        keys.forEach(k => {
            v = v[k];
        })
        return v;
    }

    setMessageConfigKey(key: keyof BotConfig["messages"], newValue: string): boolean {
        try {
            let json = this.getTeamData();

            json.config.messages[key] = newValue
            writeJSONSync(this.dataPath, json, { encoding: "utf8" })
            return true;
        } catch (e) {
            console.log(e)
            return false;
        }
    }

    setChannelConfigKey(key: keyof BotConfig["channels"], newValue: string): boolean {
        try {
            let json = this.getTeamData();

            json.config.channels[key] = newValue
            writeJSONSync(this.dataPath, json, { encoding: "utf8" })
            return true;
        } catch (e) {
            console.log(e)
            return false;
        }
    }

    setRoleConfigKey(key: keyof BotConfig["roles"], newValue: string): boolean {
        try {
            let json = this.getTeamData();

            json.config.roles[key] = newValue
            writeJSONSync(this.dataPath, json, { encoding: "utf8" })
            return true;
        } catch (e) {
            console.log(e)
            return false;
        }
    }

    getTeamMemberList(teamId: string): TeamMember[] {
        let team = this.getTeamById(teamId);
        return team.members;
    }

    getTeamList(): Team[] {
        let teams = this.getTeamData().teams;
        return Object.values(teams);
    }

    getTeamData(): APIStruct {
        let json: APIStruct = readJsonSync(this.dataPath, { encoding: "utf8" })
        return json;
    }

    getTeamById(teamId: string): Team {
        let team: Team = this.getTeamList().find(t => t.id === teamId)
        return team;
    }

    memberIsInTeam(memberId: string): Team | null {
        let v = false;
        let t: Team;
        this.getTeamList().forEach(team => {
            if (v !== false) return v;
            if (team.members.find(m => m.id === memberId)) {
                v = true
                t = team;
            }
        })
        return v ? t : null;
    }

    createTeam(leader: TeamMember, team_name: string): Team {
        let json = this.getTeamData();
        let teamId = randomUUID();
        let team: Team = {
            name: team_name,
            id: teamId,
            members: [leader],
            metadata: {
                losses: 0,
                points: 0,
                runes_avg: 0
            },

        }
        json.teams[teamId] = team;
        try {
            writeJSONSync(this.dataPath, json, { encoding: "utf8" })
            return team;
        } catch (e) {
            return null;
        }
    }

    addMemberToTeam(teamId: string, member: TeamMember): boolean {
        let json = this.getTeamData();
        let team = json.teams[teamId];
        if (!team) return false;
        // if (this.getMemberTeam(member.id) !== null) return false;
        team.members.push(member)
        json.teams[teamId] = team;
        try {
            writeJSONSync(this.dataPath, json, { encoding: "utf8" })
            return true;
        } catch (e) {
            return false;
        }
    }
    removeMemberFromTeam(member: TeamMember): boolean {
        let json = this.getTeamData();
        let team = this.memberIsInTeam(member.id);
        if (!team) return false;
        let jsonTeam = json.teams[team.id]
        // if (this.getMemberTeam(member.id) !== null) return false;
        // team.members.push(member)
        jsonTeam.members = jsonTeam.members.filter(m => m.id !== member.id);
        json.teams[team.id] = jsonTeam;
        try {
            writeJSONSync(this.dataPath, json, { encoding: "utf8" })
            return true;
        } catch (e) {
            return false;
        }
    }

    getMemberTeam(memberId: string): Team {
        let json = this.getTeamData();
        let team: Team = Object.values(json.teams).find((o: Team) => o.members.find(m => m.id === memberId) !== null)
        if (!team) return null;
        console.log(team);
        return team;
    }

    memberIsRegistered(memberId: string): boolean {
        if (this.getTeamData().registered_users[memberId] !== null && this.getTeamData()?.registered_users[memberId]?.registered) { return true; } else return false;
    }

    registerMember(memberId: string, nightfarerLazy: LazyNightfarer): boolean {
        if (this.memberIsRegistered(memberId)) return false;
        let json = this.getTeamData();
        let memberData: LazyStoredMember = {
            id: memberId,
            nightfarerLazy,
            registered: true
        }
        json.registered_users[memberId] = memberData;
        try {
            writeJSONSync(this.dataPath, json, { encoding: "utf8" })
            return true;
        } catch (e) {
            return false;
        }
    }

    unRegisterMember(memberId: string): boolean {
        console.log(this.memberIsRegistered(memberId))
        if (!this.memberIsRegistered(memberId)) return false;
        let members = this.getTeamData().registered_users;
        if (!members[memberId] || (!members[memberId].registered)) {

            return false;
        } else {
            let json = this.getTeamData();
            delete json.registered_users[memberId];
            json = json;
            try {
                writeJSONSync(this.dataPath, json, { encoding: "utf8" })
                return true;
            } catch (e) {
                return false;
            }
        }

    }

    updateMemberKnockedAmount(teamId: string, memberId: string, offset: number): Team {
        let json = this.getTeamData()
        let team = json.teams[teamId];
        let member = team.members.find(i => i.id === memberId)

        if (offset > 0) {
            team.members.find(i => i.id === memberId).metadata.downs = member.metadata.downs + offset
        } else if (offset < 0) {
            team.members.find(i => i.id === memberId).metadata.downs = member.metadata.downs - (offset * -1)
        }
        try {

            json.teams[teamId] = team;
            writeJSONSync(this.dataPath, json, { encoding: "utf8" })
            return team;
        } catch (e) {
            return null
        }

    }

    updateMemberRunesAmount(teamId: string, memberId: string, offset: number): Team {
        let json = this.getTeamData()
        let team = json.teams[teamId];
        let member = team.members.find(i => i.id === memberId)

        if (offset >= 0) {
            team.members.find(i => i.id === memberId).metadata.runes_total = member.metadata.runes_total + offset
        } else if (offset < 0) {
            team.members.find(i => i.id === memberId).metadata.runes_total = member.metadata.runes_total - (offset * -1)
        }
        try {

            json.teams[teamId] = team;
            writeJSONSync(this.dataPath, json, { encoding: "utf8" })
            return team;
        } catch (e) {
            return null
        }

    }

    updateMemberEnemiesFelledAmount(teamId: string, memberId: string, offset: number): Team {
        let json = this.getTeamData()
        let team = json.teams[teamId];
        let member = team.members.find(i => i.id === memberId)

        if (offset >= 0) {
            team.members.find(i => i.id === memberId).metadata.kills = member.metadata.kills + offset
        } else if (offset < 0) {
            team.members.find(i => i.id === memberId).metadata.kills = member.metadata.kills - (offset * -1)
        }
        try {

            json.teams[teamId] = team;
            writeJSONSync(this.dataPath, json, { encoding: "utf8" })
            return team;
        } catch (e) {
            return null
        }

    }

    calculateRuneBonus(teamId: string): number {
        const teamData = this.getTeamData().teams[teamId]
        const teamSize = teamData.members.length
        let total = 0;
        teamData.members.forEach((m: TeamMember) => {
            let meta = m.metadata;
            total += meta.runes_total
        })
        total = Math.floor(total / teamSize)
        return total / runeBonusThreshold;
    }

    calculateRuneAverage(teamId: string): Team {
        let json = this.getTeamData()
        const teamData = json.teams[teamId]
        const teamSize = teamData.members.length
        let total = 0;
        teamData.members.forEach((m: TeamMember) => {
            let meta = m.metadata;
            total += meta.runes_total
        })
        total = Math.floor(total / teamSize)
        teamData.metadata.runes_avg = total;
        json.teams[teamId] = teamData;
        writeJSONSync(this.dataPath, json, { encoding: "utf8" })
        return teamData;
    }


    /**
     * Add points to a team - modifies data.json
     *
     * @param {string} teamId The ID of the team you're adding points to
     * @param {PointValues} pointSource The source of the points being added
     * @returns {number} The updated team
     */
    addPoints(teamId: string, pointSource: PointValues): Team {
        let json = this.getTeamData();
        let team = json.teams[teamId]
        let pointAmount = pointSource;
        team.metadata.points = team.metadata.points + pointAmount;
        json.teams[teamId] = team;
        writeJSONSync(this.dataPath, json, { encoding: "utf8" })
        return team;
    }

    /**
     * Remove points from a team - modifies data.json
     *
     * @param {string} teamId The ID of the team 
     * @param {PointValues} pointSource The source of the points 
     * @returns {Team} The updated team
     */
    removePoints(teamId: string, pointSource: PointDeductionValues): Team {
        let json = this.getTeamData();
        let team = json.teams[teamId]
        let pointAmount = pointSource;
        team.metadata.points = team.metadata.points - pointAmount;
        json.teams[teamId] = team;
        writeJSONSync(this.dataPath, json, { encoding: "utf8" })
        return team
    }
}