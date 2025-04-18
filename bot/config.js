module.exports = {
    channels: {
        mainDatabase: '1362537225048293449',
        backupDatabase: '1362537478741033273',
        emailDatabase: '1362542401087868979'
    },
    // How often to backup data (in milliseconds)
    backupInterval: 1000 * 60 * 60, // Every hour
    // Maximum size for each database message (Discord has 2000 char limit)
    maxMessageSize: 1900
}; 