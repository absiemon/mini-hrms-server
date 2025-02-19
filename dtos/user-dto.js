class UserDto {
    id;
    name;
    email;
    username;
    mobile;
    image;
    type;
    address;
    status;
    constructor(user) {
        this.id = user._id,
            this.name = user.name,
            this.username = user.username,
            this.email = user.email,
            this.mobile = user.mobile,
            this.image = user?.image && `${process.env.BASE_URL}/storage/images/profile/${user?.image}`,
            this.type = user.type && user.type.charAt(0).toUpperCase() + user.type.slice(1),
            this.address = user.address,
            this.aadharNo = user.aadharNo,
            this.panNo = user.panNo,
            this.bankAccountNo = user.bankAccountNo,
            this.ifscCode = user.ifscCode,
            this.status = user.status && user.status.charAt(0).toUpperCase() + user.status.slice(1);
    }
}

module.exports = UserDto;