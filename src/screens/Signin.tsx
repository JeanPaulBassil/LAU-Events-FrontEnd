import * as yup from 'yup';
import {
  View,
  Image,
  Pressable,
  Button,
  TouchableWithoutFeedback,
  TouchableHighlight,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import TextWrapper from '../components/TextWrapper';
import { yupResolver } from '@hookform/resolvers/yup';
import LogoNoText from '../../assets/logo_no_text.svg';
import { ScrollView, TextInput } from 'react-native-gesture-handler';
import { Controller, Form, useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { isAxiosError, unWrapAuthError } from '../utils/errors';
import { AxiosError } from 'axios';
import { UserRole } from '../models/user';
import { API_URL } from '@env';

type SignInForm = {
  email: string;
  password: string;
};

const SignInFormSchema = yup.object().shape({
  email: yup
    .string()
    .email('Invalid email')
    .required('Email is required')
    .matches(/^([a-zA-Z0-9_\-\.]+)@lau\.edu(\.lb)?$/, 'Invalid LAU email'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

const Signin = ({ navigation }: any) => {
  const { authState, signIn } = useAuth();
  const {
    control,
    getValues,
    trigger,
    formState: { errors, isValid },
  } = useForm<SignInForm>({
    resolver: yupResolver(SignInFormSchema),
  });

  const [signinError, setSigninError] = React.useState<string | null>(null);

  useEffect(() => {
    // only if it set to false then we go to verification
    // if it was null, we go to signin page
    if (authState.isVerified === false) {
      navigation.navigate('Verification');
      return;
    }

    if (authState.user && authState.user.role === UserRole.ADMIN) {
      navigation.navigate('AdminHome');
    } else if (authState.user && authState.user.role === UserRole.USER) {
      navigation.navigate('UserHome');
    }
  }, [authState]);

  const onSubmit = async (data: SignInForm) => {
    setSigninError(null);
    try {
      await signIn(data);
    } catch (e) {
      if (isAxiosError(e)) {
        setSigninError(unWrapAuthError(e as AxiosError));
      } else {
        setSigninError('Something went wrong');
      }
    }
  };

  return (
    <SafeAreaView className="h-full w-full">
      <ScrollView className="flex w-full flex-col bg-brand-lighter px-6 pr-10 py-12">
        <LogoNoText width={250} height={93}></LogoNoText>
        <View>
          <TextWrapper className="text-2xl text-black">Welcome to LAU</TextWrapper>
          <View className="flex items-start gap-2 flex-row">
            <TextWrapper className="text-2xl text-black">Events</TextWrapper>
            <TextWrapper className="text-2xl text-brand">explorer!</TextWrapper>
          </View>
        </View>
        <TextWrapper className="text-gray pt-16">
          Please use your LAU e-mail username (only the part before @) and password.
        </TextWrapper>

        {signinError && (
          <TextWrapper className="text-error text-sm mt-3">{signinError}</TextWrapper>
        )}
        <View className="flex flex-col w-full items-start justify-start mt-20">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  placeholder="Email"
                  className="border-b-[1px] border-gray w-full mt-5"
                  onBlur={onBlur}
                  cursorColor="green"
                  onChangeText={(value) => onChange(value)}
                  value={value}
                />
                {errors.email && (
                  <TextWrapper className="text-error text-sm">{errors.email.message}</TextWrapper>
                )}
              </>
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  placeholder="Password"
                  onBlur={onBlur}
                  className="border-b-[1px] border-gray w-full mt-14"
                  cursorColor="green"
                  textContentType="password"
                  secureTextEntry={true}
                  scrollEnabled={true}
                  onChangeText={(value) => onChange(value)}
                  value={value}
                />
                {errors.password && (
                  <TextWrapper className="text-error text-sm">
                    {errors.password.message}
                  </TextWrapper>
                )}
              </>
            )}
          />
        </View>
        <View className="w-full flex flex-row items-center justify-between mt-12 z-10">
          <TextWrapper className="text-black text-2xl">Sign in</TextWrapper>
          <TouchableHighlight
            className="bg-brand rounded-full w-16 h-16 flex items-center justify-center"
            onPress={() => {
              trigger();
              if (isValid) {
                const { email, password } = getValues();
                onSubmit({ email, password });
              }
            }}>
            <Image source={require('../../assets/arrow-right.png')}></Image>
          </TouchableHighlight>
        </View>
        <View className="w-full flex flex-row items-center justify-between mt-5">
          <TextWrapper className="text-gray text-sm">Don't have an account?</TextWrapper>
          <TextWrapper
            className="text-gray text-sm underline"
            onPress={() => {
              navigation.navigate('Signup');
            }}>
            Register Now
          </TextWrapper>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Signin;
