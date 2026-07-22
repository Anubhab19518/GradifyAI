import React from "react";
import './styles.css'
import Warning from '../../assets/warning.png'
import ProfileImage from '../../assets/profile_image.webp';
import EditProfile from '../../assets/edit.png';

const UserWelcome = () => {
    return (
        <>
            <div className='user-welcome-holder'>
                <div>
                    <h1 className="profile-welcome">Hey, Celine!<br></br>Here's your treasure</h1>
                    <p className="profile-text">Look out for your necessary basic details as page admin here,<br></br>
                        edit hem as per your wish and use them to ease the evolution process</p>
                    <div className="profile-buttons">
                        <button>Teacher</button>
                        <button>Total papers <span>12</span></button>
                    </div>
                    <div className="warning">
                        <img src={Warning} />
                        <p>You’re currently on free tier. <span>Upgrade your account</span> to avail more features</p>
                    </div>
                </div>
                <div className="profile-image">
                    <img className="profile-image-img" src={ProfileImage} />
                    <div className="edit-profile">
                        <img src={EditProfile} />
                    </div>
                </div>
            </div>
        </>
    )
};

export default UserWelcome;