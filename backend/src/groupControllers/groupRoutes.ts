import { Router } from 'express';
import addMember from './addMember';
import removeMember from './removeMember';
import getDetails from './getDetails';
import createGroup from './createGroup';
import deleteGroup from './deleteGroup';
import createEvent from './createEvent';
import getEvents from './getEvents';
import voteForGame from './voteForGame';

const router = Router();

router.use(addMember);
router.use(removeMember);
router.use(getDetails);
router.use(getEvents);
router.use(createGroup);
router.use(deleteGroup);
router.use(createEvent);
router.use(voteForGame);

export default router;