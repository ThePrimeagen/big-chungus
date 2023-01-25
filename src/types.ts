import z from "zod";

export const MessageType = {
    Join: 1,
    Leave: 2,
    Message: 3,
} as const;

const messageSchema = z.object({
    type: z.literal(MessageType.Message),
    msg: z.object({
        date: z.date(),
        group: z.array(z.string()),
        msg: z.string(),
    })
});

const joinSchema = z.object({
    type: z.literal(MessageType.Join),
    join: z.array(z.string()),
});

const leaveSchema = z.object({
    type: z.literal(MessageType.Leave),
    leave: z.array(z.string()),
});

const myUnion = z.discriminatedUnion("type", [
    messageSchema,
    joinSchema,
    leaveSchema,
]);

export type Message = z.infer<typeof messageSchema>;
export type Join = z.infer<typeof joinSchema>;
export type Leave = z.infer<typeof leaveSchema>;
export type WSMessage = z.infer<typeof myUnion>;

export function validate(data: WSMessage): boolean {
    return myUnion.safeParse(data).success;
}
