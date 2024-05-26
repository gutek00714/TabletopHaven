import { Router } from 'express';
import getUserProfile from './getProfile';
import addFriend from './addFriend';
import removeFriends from './removeFriend';
import isFollowing from './isFollowing';
import getFriends from './getFriends';
import searchUsers from './searchUser';
import getUserGroups from './getUserGroups';
import getCurrentUser from './getCurrentUser';
import getEligibleGroups from './getEligibleGroups';

const router = Router();

router.use(searchUsers);
router.use(isFollowing);
router.use(addFriend);
router.use(removeFriends);
router.use(getFriends);
router.use(getUserProfile);
router.use(getUserGroups);
router.use(getCurrentUser);
router.use(getEligibleGroups);

export default router;
