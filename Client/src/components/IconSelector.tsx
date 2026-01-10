import { EIconName } from '../common/icon-name.enum';
import {
  IoIosFitness,
  IoIosRestaurant,
  IoMdCloudOutline,
} from 'react-icons/io';
import { LuCandy } from 'react-icons/lu';
import { BiCameraMovie, BiSolidDonateHeart } from 'react-icons/bi';
import {
  PiAirplaneTiltFill,
  PiBabyThin,
  PiBankThin,
  PiBasketballThin,
  PiBicycleThin,
  PiBookOpenTextThin,
  PiBowlFoodThin,
  PiBriefcaseThin,
  PiBusThin,
  PiCameraThin,
  PiCatThin,
  PiCodeThin,
  PiCoffeeThin,
  PiCreditCardThin,
  PiCurrencyCircleDollarThin,
  PiDesktopTowerThin,
  PiDogThin,
  PiEyeglassesThin,
  PiFaceMaskThin,
  PiFootballThin,
  PiGameControllerThin,
  PiHammerThin,
  PiHandbagThin,
  PiHouseThin,
  PiLaptopThin,
  PiLightningThin,
  PiMicrophoneStageThin,
  PiMusicNotesThin,
  PiPantsThin,
  PiPawPrintThin,
  PiPiggyBankThin,
  PiPizzaThin,
  PiPopcornThin,
  PiPottedPlantThin,
  PiScissorsThin,
  PiShoppingCartThin,
  PiSyringeThin,
  PiTaxiThin,
  PiTicketThin,
  PiTramThin,
  PiWatchThin,
  PiWifiHighThin,
  PiWineThin,
  PiWrenchThin,
} from 'react-icons/pi';
import {
  GiCampfire,
  GiCampingTent,
  GiCoins,
  GiGamepad,
  GiHealing,
  GiHospital,
  GiLipstick,
  GiMoneyStack,
  GiNoodles,
  GiPayMoney,
  GiPerspectiveDiceSixFacesThree,
  GiPresent,
  GiReceiveMoney,
  GiSailboat,
  GiSlicedBread,
  GiSteak,
  GiSushis,
  GiTopHat,
} from 'react-icons/gi';
import {
  MdOutlineCurrencyExchange,
  MdOutlineElderly,
  MdOutlineHealing,
  MdPhoneAndroid,
  MdPhoneIphone,
} from 'react-icons/md';
import {
  IoBowlingBallOutline,
  IoFastFoodOutline,
  IoShirtSharp,
  IoWaterSharp,
} from 'react-icons/io5';
import { BsCashCoin } from 'react-icons/bs';
import {
  LiaLuggageCartSolid,
  LiaRunningSolid,
  LiaSwimmerSolid,
} from 'react-icons/lia';
import { RiGraduationCapFill } from 'react-icons/ri';

type IconSelectorProps = {
  name: EIconName;
};

const IconSelector = ({ name }: IconSelectorProps) => {
  switch (name) {
    case EIconName.AIRPLANE:
      return <PiAirplaneTiltFill />;
    case EIconName.BABY:
      return <PiBabyThin />;
    case EIconName.BAG:
      return <PiHandbagThin />;
    case EIconName.BANK:
      return <PiBankThin strokeWidth={1} />;
    case EIconName.BASKETBALL:
      return <PiBasketballThin />;
    case EIconName.BOOK:
      return <PiBookOpenTextThin />;
    case EIconName.BOWLING:
      return <IoBowlingBallOutline />;
    case EIconName.BREAD:
      return <GiSlicedBread />;
    case EIconName.BRIEF_CASE:
      return <PiBriefcaseThin />;
    case EIconName.BUS:
      return <PiBusThin />;
    case EIconName.CAMERA:
      return <PiCameraThin />;
    case EIconName.CAMP:
      return <GiCampfire />;
    case EIconName.CASH_COIN:
      return <BsCashCoin />;
    case EIconName.CASH:
      return <GiMoneyStack />;
    case EIconName.CAT:
      return <PiCatThin />;
    case EIconName.CINEMA:
      return <BiCameraMovie />;
    case EIconName.CLOUD:
      return <IoMdCloudOutline />;
    case EIconName.CODE:
      return <PiCodeThin />;
    case EIconName.COFFEE:
      return <PiCoffeeThin />;
    case EIconName.COIN:
      return <GiCoins />;
    case EIconName.CREDIT_CARD:
      return <PiCreditCardThin />;
    case EIconName.CYCLING:
      return <PiBicycleThin />;
    case EIconName.DESKTOP:
      return <PiDesktopTowerThin />;
    case EIconName.DICE:
      return <GiPerspectiveDiceSixFacesThree />;
    case EIconName.DOG:
      return <PiDogThin />;
    case EIconName.DONATE:
      return <BiSolidDonateHeart />;
    case EIconName.DRINK:
      return <PiWineThin />;
    case EIconName.ELDER:
      return <MdOutlineElderly />;
    case EIconName.EXCHANGE:
      return <MdOutlineCurrencyExchange />;
    case EIconName.FAST_FOOD:
      return <IoFastFoodOutline />;
    case EIconName.FOOTBALL:
      return <PiFootballThin />;
    case EIconName.GAME:
      return <GiGamepad />;
    case EIconName.GAME2:
      return <PiGameControllerThin />;
    case EIconName.GLASS:
      return <PiEyeglassesThin />;
    case EIconName.GRADUATION:
      return <RiGraduationCapFill />;
    case EIconName.HAMMER:
      return <PiHammerThin />;
    case EIconName.HAT:
      return <GiTopHat />;
    case EIconName.HEAL:
      return <MdOutlineHealing />;
    case EIconName.HEALTH:
      return <GiHealing />;
    case EIconName.HOSPITAL:
      return <GiHospital />;
    case EIconName.HOUSE:
      return <PiHouseThin />;
    case EIconName.LAPTOP:
      return <PiLaptopThin />;
    case EIconName.LIPSTICK:
      return <GiLipstick />;
    case EIconName.LUGGAGE:
      return <LiaLuggageCartSolid />;
    case EIconName.MASK:
      return <PiFaceMaskThin />;
    case EIconName.MIC:
      return <PiMicrophoneStageThin />;
    case EIconName.MONEY:
      return <PiCurrencyCircleDollarThin />;
    case EIconName.MONEY2:
      return <GiPayMoney />;
    case EIconName.MONEY3:
      return <GiReceiveMoney />;
    case EIconName.MUSIC:
      return <PiMusicNotesThin />;
    case EIconName.NOODLE:
      return <GiNoodles />;
    case EIconName.PAW:
      return <PiPawPrintThin />;
    case EIconName.PANTS:
      return <PiPantsThin />;
    case EIconName.PHONE_ANDROID:
      return <MdPhoneAndroid />;
    case EIconName.PHONE:
      return <MdPhoneIphone />;
    case EIconName.PIGGY_BANK:
      return <PiPiggyBankThin />;
    case EIconName.PIZZA:
      return <PiPizzaThin />;
    case EIconName.PLANT:
      return <PiPottedPlantThin />;
    case EIconName.POPCORN:
      return <PiPopcornThin />;
    case EIconName.PRESENT:
      return <GiPresent />;
    case EIconName.RESTAURANT:
      return <IoIosRestaurant strokeWidth={1} />;
    case EIconName.RICE:
      return <PiBowlFoodThin />;
    case EIconName.RUN:
      return <LiaRunningSolid />;
    case EIconName.SAIL:
      return <GiSailboat />;
    case EIconName.SCISSORS:
      return <PiScissorsThin />;
    case EIconName.SHIRT:
      return <IoShirtSharp />;
    case EIconName.SHOPPING_CART:
      return <PiShoppingCartThin />;
    case EIconName.SNACK:
      return <LuCandy strokeWidth={1} />;
    case EIconName.STEAK:
      return <GiSteak />;
    case EIconName.SUSHI:
      return <GiSushis />;
    case EIconName.SWIM:
      return <LiaSwimmerSolid />;
    case EIconName.SYRINGE:
      return <PiSyringeThin />;
    case EIconName.TAXI:
      return <PiTaxiThin />;
    case EIconName.TENT:
      return <GiCampingTent />;
    case EIconName.TICKET:
      return <PiTicketThin />;
    case EIconName.TRAM:
      return <PiTramThin />;
    case EIconName.UTILS:
      return <PiLightningThin />;
    case EIconName.WATCH:
      return <PiWatchThin />;
    case EIconName.WEIGHT_LIFTING:
      return <IoIosFitness />;
    case EIconName.WATER:
      return <IoWaterSharp />;
    case EIconName.WIFI:
      return <PiWifiHighThin />;
    case EIconName.WRENCH:
      return <PiWrenchThin />;
    default:
      return <div>Icon</div>;
  }
};

export default IconSelector;
