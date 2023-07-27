import { View, Text, ImageBackground, Pressable } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Club } from '../../models/club';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextWrapper from '../../components/TextWrapper';
import dayjs from 'dayjs';
import EventsSVG from '../../../assets/Icons/events.svg';
import WaveTopLeftSVG from '../../../assets/wave_top_left.svg';
import ArrowRight from '../../../assets/Icons/arrow_right.svg';
import SmallEventCard from '../../components/SmallEventCard';
import { Event, EventStatus } from '../../models/event';
import { FlatList } from 'react-native-gesture-handler';
import { useAuth } from '../../context/AuthContext';
import useSession from '../../hooks/useSession';
import { ClubApi } from '../../utils/api/crud/clubs';

const event_placeholder = require('../../../assets/event_image_placeholder.png');

const ClubDetails = ({ route, navigation }: any) => {
  const { clubId } = route.params;
  const authContext = useAuth();
  const session = useSession(authContext.authState);

  const [club, setClub] = useState<Club | null>(null);

  useEffect(() => {
    if (!session || !clubId) {
      authContext.signOut();
      return;
    }

    try {
      const getClub = async () => {
        const res = await new ClubApi(session).findOne(clubId);
        setClub(res);
      };
      getClub();
    } catch (e) {
      console.log(e);
      authContext.signOut();
    }
  }, []);

  return (
    <SafeAreaView className="w-full h-full bg-brand-lighter relative py-10 px-6">
      <View className="absolute top-0 left-0">
        <WaveTopLeftSVG />
      </View>
      <View className="w-full flex justify-center items-center relative flex-row">
        <Pressable
          className="absolute left-4 w-10 h-10 flex justify-center items-center"
          onPress={() => {
            navigation.goBack();
          }}>
          <ArrowRight width={18} height={18} color="#fff" rotation={180}></ArrowRight>
        </Pressable>
        <TextWrapper className="text-2xl">Club Details</TextWrapper>
      </View>
      <View className="w-full flex items-center justify-start p-2 mt-5 flex-row">
        <View className="w-24 h-24">
          <ImageBackground
            source={event_placeholder}
            resizeMode="cover"
            borderRadius={100}
            className="w-full h-full"></ImageBackground>
        </View>
        <View className="w-4" />
        <View className="flex flex-col h-full mt-2">
          <TextWrapper className="text-xl text-black">{club?.clubName}</TextWrapper>
          <View className="h-2" />
          <TextWrapper className="text-sm text-gray">Added on: {club?.createdAt}</TextWrapper>
        </View>
      </View>

      <View className="mt-8 w-full pr-4">
        <View className="flex flex-row justify-between items-center w-full ">
          <TextWrapper className="text-black text-2xl">Events</TextWrapper>
          <EventsSVG width={25} height={25} color="#005C4A" />
        </View>
        {club?.events && (
          <View className="mt-8 w-full pb-10">
            <FlatList
              numColumns={1}
              data={club?.events}
              ItemSeparatorComponent={() => {
                return <View className="h-6" />;
              }}
              renderItem={({ item, index }) => {
                return <SmallEventCard event={item} navigation={navigation} key={index} />;
              }}></FlatList>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ClubDetails;
