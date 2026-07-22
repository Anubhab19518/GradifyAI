import React from "react";
import Notification from '../../assets/notification.png';
import './styles.css';
import Woman from '../../assets/niggi.webp';
import lines from '../../assets/lines.png';
import { useNavigate } from "react-router-dom";

const UserProfile = () => {
    const profilePicture = localStorage.getItem("dp") || Woman;
    const navigate = useNavigate();

    return (
        <div className="user-profile-holder">
            <div className='circle'>
                    <img className="circle-icon" src={Notification} />
                </div>
            <div className='circle'>
                <img className="profile-img" src={profilePicture} alt="User Profile" />
            </div>
            <button className="create-button" onClick={() => navigate('/create-exam')}>
                <img src={lines} height="17px" width="17px"></img>Create
            </button>
        </div>
    );
};

export default UserProfile;
