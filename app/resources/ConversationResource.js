import Resource from 'resources.js';
 
class ConversationResource extends Resource {
  toArray() {
    return {
      title: `${this.title} - Title`
    }
  }
}
 
module.exports = ConversationResource;
