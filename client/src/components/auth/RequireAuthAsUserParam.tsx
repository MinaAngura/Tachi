import { ErrorPage } from "app/pages/ErrorPage";
import { UserContext } from "context/UserContext";
import React, { useContext } from "react";
import { useParams } from "react-router-dom";
import { UserAuthLevels } from "tachi-common";
import { JustChildren } from "types/react";

export default function RequireAuthAsUserParam({ children }: JustChildren) {
	const { userID } = useParams<{ userID: string }>();
	const { user } = useContext(UserContext);

	if (!user) {
		return <ErrorPage statusCode={401} customMessage="You are not signed in!" />;
	}

	if (
		userID !== user.id.toString() &&
		userID.toLowerCase() !== user.usernameLowercase &&
		user.authLevel !== UserAuthLevels.ADMIN
	) {
		return <ErrorPage statusCode={403} customMessage="You are not authorised to view this." />;
	}

	return <>{children}</>;
}
