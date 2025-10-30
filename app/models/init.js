import User from './Users.js';
import UserDevice from './UserDevice.js';
import Notification from './Notifications.js';
import Conversation from './Conversation.js';
import Message from './Message.js';
import participant from './Participant.js';
import Call from './Call.js';
import CallParticipant from './CallParticipant.js';
import Content from './Content.js';
import Transcription from './Transcription.js'

User.UserDevice = User.hasMany(UserDevice, { foreignKey: 'user_id', as: 'devices' });
User.Notification = User.hasMany(Notification, { foreignKey: 'user_id', as: 'notification' });

UserDevice.user = UserDevice.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Conversation.participant = Conversation.hasMany(participant);
Conversation.user = Conversation.belongsTo(User, { foreignKey: 'user_id', as: 'users' });

Conversation.messages = Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'messages' });
Message.user = Message.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

participant.user = participant.belongsTo(User, { foreignKey: "user_id", as: "user" });

Call.user = Call.belongsTo(User, { foreignKey: "user_id", as: "user" });
Call.participant = Call.hasMany(CallParticipant, { foreignKey: 'call_id', as: 'call_participents' })

CallParticipant.call = CallParticipant.belongsTo(Call, { foreignKey: "call_id", as: "call" });
CallParticipant.user = CallParticipant.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.transcriptions = User.hasMany(Transcription, { foreignKey: 'user_id', as: 'transcriptions' });
Transcription.user = Transcription.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Call.transcriptions = Call.hasMany(Transcription, { foreignKey: 'call_id', as: 'transcriptions' });
Transcription.call = Transcription.belongsTo(Call, { foreignKey: 'call_id', as: 'call' });

export {
    User,
    UserDevice,
    Notification,
    Conversation,
    Message,
    participant,
    Call,
    CallParticipant,
    Content
};